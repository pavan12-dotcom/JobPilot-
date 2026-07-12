// src/queues/jobFetch.queue.js
const Bull = require('bull');
const env = require('../config/env');
const { getRedisConfig } = require('./redis.config');
const logger = require('../utils/logger');

let jobFetchQueue = null;

function getJobFetchQueue() {
  if (jobFetchQueue) return jobFetchQueue;

  jobFetchQueue = new Bull('job-fetch', {
    redis: getRedisConfig(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });

  jobFetchQueue.on('completed', (job) => logger.info(`✅ Job fetch completed: ${job.id}`));
  jobFetchQueue.on('failed', (job, err) => logger.error(`❌ Job fetch failed: ${job.id}`, err.message));

  return jobFetchQueue;
}

// Schedule periodic job fetching (every hour) + immediate run on startup
async function schedulePeriodicFetch() {
  const queue = getJobFetchQueue();

  // ── Immediate startup fetch ───────────────────────────────────────────────
  // Runs 5 seconds after boot so all workers are registered before processing.
  // The unique jobId prevents duplicate startup jobs on repeated fast restarts.
  await queue.add(
    'fetch',
    { type: 'all-users' },
    {
      delay: 5000,
      jobId: `startup-fetch-${Math.floor(Date.now() / 60000)}`, // unique per minute
      attempts: 2,
    },
  );
  logger.info('🚀 Startup job fetch queued (fires in ~5s)');

  // ── Hourly repeating fetch ────────────────────────────────────────────────
  await queue.add(
    'periodic-fetch',
    { type: 'all-users' },
    {
      repeat: { cron: '0 * * * *' }, // Every hour at :00
      jobId: 'periodic-fetch',
    },
  );

  logger.info('📅 Periodic job fetch scheduled (every hour)');
}

module.exports = { getJobFetchQueue, schedulePeriodicFetch, get jobFetchQueue() { return getJobFetchQueue(); } };

