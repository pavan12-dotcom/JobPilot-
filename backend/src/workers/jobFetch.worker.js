// src/workers/jobFetch.worker.js
const prisma = require('../db/prisma');
const jobService = require('../services/job.service');
const { sendNewMatches } = require('../services/notification.service');
const { getJobMatchQueue } = require('../queues/jobMatch.queue');
const logger = require('../utils/logger');

/**
 * Process job fetch queue items
 * Called by Bull when a fetch job is dequeued
 */
async function processJobFetch(job) {
  const { userId, preferences, type } = job.data;

  logger.info(`🔍 Processing job fetch: ${type || `user ${userId}`}`);

  let usersToProcess = [];

  if (type === 'all-users') {
    // Fetch for all users with active preferences
    usersToProcess = await prisma.user.findMany({
      include: { preferences: true },
      where: { preferences: { isNot: null } },
    });
  } else if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });
    if (user) usersToProcess = [user];
  }

  for (const user of usersToProcess) {
    if (!user.preferences) continue;

    try {
      const stats = await jobService.fetchJobsForUser(user.preferences);
      logger.info(`User ${user.email}: fetched ${stats.total}, ${stats.created} new`);

      if (stats.created > 0) {
        // Get new jobs that need matching
        const recentJobs = await prisma.job.findMany({
          where: {
            created_at: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // Last 10 mins
            is_active: true,
          },
          take: 50,
        });

        // Enqueue match jobs
        const matchQueue = getJobMatchQueue();
        for (const newJob of recentJobs) {
          await matchQueue.add(
            'match',
            { userId: user.id, jobId: newJob.id },
            { jobId: `match-${user.id}-${newJob.id}` },
          );
        }

        logger.info(`Enqueued ${recentJobs.length} match jobs for ${user.email}`);

        // Send notification (non-blocking)
        sendNewMatches(user.email, user.name, stats.created, null).catch(() => {});
      }
    } catch (err) {
      logger.error(`Job fetch failed for user ${user.id}:`, err.message);
    }
  }

  return { processed: usersToProcess.length };
}

/**
 * Register this worker with the job fetch queue
 */
function registerJobFetchWorker(queue) {
  queue.process('periodic-fetch', 2, processJobFetch);
  queue.process('fetch', 2, processJobFetch);
  logger.info('👷 Job fetch worker registered');
}

module.exports = { processJobFetch, registerJobFetchWorker };
