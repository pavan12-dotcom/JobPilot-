// src/workers/fallback.worker.js
// Hourly fallback job fetch + match loop — used when Redis / Bull is unavailable.
// Runs as a simple in-process setInterval instead of a Bull queue worker.

const logger = require('../utils/logger');

/**
 * Core fetch + match cycle for all users with active preferences.
 * Called immediately on startup AND every hour by setInterval.
 */
async function runFallbackFetch() {
  logger.info('⏰ Running fallback job fetch + match cycle');

  try {
    const prisma = require('../db/prisma');
    const jobService = require('../services/job.service');
    const { scoreJobMatch } = require('../ai/jobMatcher');
    const { broadcastToUser } = require('../services/websocket.service');

    const users = await prisma.user.findMany({
      include: { preferences: true },
      where: { preferences: { isNot: null } },
    });

    if (users.length === 0) {
      logger.info('⏰ No users with preferences — skipping fetch cycle');
      return;
    }

    for (const user of users) {
      if (!user.preferences) continue;

      // ── Step 1: Fetch jobs regardless of resume status ──────────────────
      let stats = { created: 0, updated: 0 };
      try {
        stats = await jobService.fetchJobsForUser(user.preferences);
        logger.info(`⏰ Fetch for ${user.email}: ${stats.created} new, ${stats.updated} refreshed`);
      } catch (fetchErr) {
        logger.error(`⏰ Fetch failed for ${user.email}:`, fetchErr.message);
      }

      // ── Step 2: Get resume — active first, then fall back to most-recent ─
      let resume = await prisma.resume.findFirst({
        where: { user_id: user.id, is_active: true },
        orderBy: { created_at: 'desc' },
      });

      if (!resume) {
        // Auto-activate the most recent resume so the user isn't stuck
        const latest = await prisma.resume.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' },
        });
        if (latest) {
          await prisma.resume.update({
            where: { id: latest.id },
            data: { is_active: true },
          });
          resume = { ...latest, is_active: true };
          logger.info(`⏰ Auto-activated resume ${latest.id} for ${user.email}`);
        }
      }

      if (!resume || !resume.parsed_data) {
        logger.warn(`⏰ No resume with parsed data for ${user.email} — skipping match step`);
        // Still broadcast so the UI refreshes the job list (even without AI scores)
        try {
          const { broadcastToUser } = require('../services/websocket.service');
          broadcastToUser(user.id, 'jobs-refreshed', {
            newMatches: 0,
            newJobs: stats?.created || 0,
            timestamp: new Date().toISOString(),
          });
        } catch (_) {}
        continue;
      }

      // ── Step 3: Score unmatched jobs (paginated, up to 100 per cycle) ──
      const unmatched = await prisma.job.findMany({
        where: {
          is_active: true,
          job_matches: { none: { user_id: user.id } },
        },
        orderBy: { created_at: 'desc' },
        take: 100,
      });

      logger.info(`⏰ Scoring ${unmatched.length} unmatched jobs for ${user.email}`);
      let matched = 0;
      for (const j of unmatched) {
        try {
          const matchResult = await scoreJobMatch(resume.parsed_data, j);
          await prisma.jobMatch.create({
            data: {
              user_id: user.id,
              job_id: j.id,
              resume_id: resume.id,
              match_score: matchResult.match_score,
              match_reasons: matchResult,
            },
          });
          matched++;
        } catch (matchErr) {
          logger.error(`⏰ Match failed for job ${j.id}:`, matchErr.message);
        }
      }
      logger.info(`⏰ Created ${matched} new matches for ${user.email}`);

      // ── Step 4: Broadcast real-time update to connected clients ──────────
      try {
        broadcastToUser(user.id, 'jobs-refreshed', {
          newMatches: matched,
          newJobs: stats?.created || 0,
          timestamp: new Date().toISOString(),
        });
        broadcastToUser(user.id, 'stats-updated', { source: 'hourly-fetch' });
        logger.info(`📡 Broadcasted jobs-refreshed to ${user.email}: ${matched} new matches`);
      } catch (wsErr) {
        logger.warn('WS broadcast failed (non-fatal):', wsErr.message);
      }
    } // end for (const user of users)
  } catch (err) {
    logger.error('Fallback periodic fetch failed:', err.message);
  }
}

/**
 * Start the fallback worker.
 * Runs immediately on startup (so users see jobs within seconds, not after 1 hour),
 * then repeats every hour.
 */
function startFallbackWorker() {
  logger.info('⏰ Starting local fallback worker (Redis unavailable)');

  // ── Run immediately so new users don't wait 1 hour ───────────────────────
  // Small delay (5s) to let server finish booting before making DB calls
  setTimeout(() => runFallbackFetch(), 5000);

  // ── Then repeat every hour ───────────────────────────────────────────────
  let isFetchRunning = false;
  const intervalId = setInterval(async () => {
    if (isFetchRunning) {
      logger.warn('⏰ Skipping fallback fetch tick — previous run still in progress');
      return;
    }
    isFetchRunning = true;
    try {
      await runFallbackFetch();
    } finally {
      isFetchRunning = false;
    }
  }, 60 * 60 * 1000); // 1 hour

  return intervalId; // Caller can clearInterval(intervalId) if needed
}

module.exports = { startFallbackWorker, runFallbackFetch };
