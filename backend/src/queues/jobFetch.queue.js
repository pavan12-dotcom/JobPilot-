// src/queues/jobFetch.queue.js
const Bull = require('bull');
const env = require('../config/env');
const logger = require('../utils/logger');

let jobFetchQueue = null;

function getJobFetchQueue() {
  if (jobFetchQueue) return jobFetchQueue;

  jobFetchQueue = new Bull('job-fetch', {
    redis: env.REDIS_URL,
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

// Schedule periodic job fetching (every hour)
async function schedulePeriodicFetch() {
  const queue = getJobFetchQueue();

  // Add repeating job
  await queue.add(
    'periodic-fetch',
    { type: 'all-users' },
    {
      repeat: { cron: '0 * * * *' }, // Every hour
      jobId: 'periodic-fetch',
    },
  );

  logger.info('📅 Periodic job fetch scheduled (every hour)');
}

module.exports = { getJobFetchQueue, schedulePeriodicFetch, get jobFetchQueue() { return getJobFetchQueue(); } };
