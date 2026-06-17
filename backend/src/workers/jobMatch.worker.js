// src/workers/jobMatch.worker.js
const prisma = require('../db/prisma');
const { scoreJobMatch } = require('../ai/jobMatcher');
const { getAutoApplyQueue } = require('../queues/autoApply.queue');
const applicationService = require('../services/application.service');
const resumeService = require('../services/resume.service');
const logger = require('../utils/logger');

/**
 * Process job match queue items
 */
async function processJobMatch(job) {
  const { userId, jobId } = job.data;

  // Get user with preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true },
  });

  if (!user || !user.preferences) return { skipped: true, reason: 'no preferences' };

  // Get active resume
  const resume = await resumeService.getActiveResume(userId);
  if (!resume || !resume.parsed_data) return { skipped: true, reason: 'no resume' };

  // Get job
  const jobRecord = await prisma.job.findUnique({ where: { id: jobId } });
  if (!jobRecord) return { skipped: true, reason: 'job not found' };

  // Check if already matched
  const existing = await prisma.jobMatch.findFirst({ where: { user_id: userId, job_id: jobId } });
  if (existing) return { skipped: true, reason: 'already matched' };

  // Pre-filter: check if job matches user preferences before calling Gemini
  const prefs = user.preferences;
  const locationMatch =
    prefs.target_locations.length === 0 ||
    prefs.target_locations.some(
      (loc) => jobRecord.location.toLowerCase().includes(loc.toLowerCase()) || loc === 'Remote',
    );

  const typeMatch =
    prefs.job_types.length === 0 ||
    prefs.job_types.includes(jobRecord.job_type);

  if (!locationMatch || !typeMatch) {
    return { skipped: true, reason: 'preference filter' };
  }

  // Score with Gemini AI
  logger.debug(`Scoring ${jobRecord.title} at ${jobRecord.company} for ${user.email}`);
  const matchResult = await scoreJobMatch(resume.parsed_data, jobRecord);

  // Save to DB
  const match = await prisma.jobMatch.create({
    data: {
      user_id: userId,
      job_id: jobId,
      resume_id: resume.id,
      match_score: matchResult.match_score,
      match_reasons: matchResult,
    },
  });

  logger.info(`Match: ${jobRecord.title} → ${matchResult.match_score}/100 for ${user.email}`);

  // Trigger auto-apply if threshold met
  if (
    prefs.auto_apply_enabled &&
    matchResult.match_score >= prefs.min_match_score
  ) {
    const { exceeded } = await applicationService.checkDailyLimit(userId);

    if (!exceeded) {
      // Check if not already applied
      const existingApp = await prisma.application.findFirst({
        where: { user_id: userId, job_id: jobId },
      });

      if (!existingApp) {
        const application = await applicationService.createApplication(
          userId, jobId, resume.id, match.id, 'AUTO',
        );

        const autoApplyQueue = getAutoApplyQueue();
        await autoApplyQueue.add(
          'apply',
          { applicationId: application.id },
          { attempts: 2, backoff: 10000 },
        );

        logger.info(`🤖 Auto-apply queued for ${jobRecord.title} (score: ${matchResult.match_score})`);
      }
    }
  }

  return { matchId: match.id, score: matchResult.match_score };
}

function registerJobMatchWorker(queue) {
  queue.process('match', 3, processJobMatch); // 3 concurrent matchers
  logger.info('👷 Job match worker registered');
}

module.exports = { processJobMatch, registerJobMatchWorker };
