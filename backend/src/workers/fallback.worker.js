// src/workers/fallback.worker.js
// Hourly fallback job fetch + match loop — used when Redis / Bull is unavailable.
// Runs as a simple in-process setInterval instead of a Bull queue worker.

const logger = require('../utils/logger');

/**
 * Start a 1-hour interval that fetches jobs and scores matches for every user
 * with active preferences. Only used when Redis is not available.
 */
function startFallbackWorker() {
  logger.info('⏰ Starting local fallback setInterval loop for hourly fetches');
  let isFetchRunning = false; // Lock: prevents overlapping concurrent fetch runs

  const intervalId = setInterval(async () => {
    if (isFetchRunning) {
      logger.warn('⏰ Skipping fallback fetch tick — previous run still in progress');
      return;
    }
    isFetchRunning = true;
    logger.info('⏰ Running fallback periodic hourly job fetch');

    try {
      const prisma = require('../db/prisma');
      const jobService = require('../services/job.service');
      const { scoreJobMatch } = require('../ai/jobMatcher');
      const { broadcastToUser } = require('../services/websocket.service');

      const users = await prisma.user.findMany({
        include: { preferences: true },
        where: { preferences: { isNot: null } },
      });

      for (const user of users) {
        if (!user.preferences) continue;

        // ── Step 1: Fetch jobs regardless of resume status ──────────────────
        let stats = { created: 0 };
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
    } finally {
      isFetchRunning = false; // Always release the lock
    }
  }, 60 * 60 * 1000); // 1 hour

  return intervalId; // Caller can clearInterval(intervalId) if needed
}

module.exports = { startFallbackWorker };
