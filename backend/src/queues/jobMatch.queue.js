// src/queues/jobMatch.queue.js
const Bull = require('bull');
const env = require('../config/env');
const logger = require('../utils/logger');

let jobMatchQueue = null;

function getJobMatchQueue() {
  if (jobMatchQueue) return jobMatchQueue;

  jobMatchQueue = new Bull('job-match', {
    redis: env.REDIS_URL,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
      removeOnComplete: 200,
      removeOnFail: 100,
    },
    limiter: {
      max: 15, // Gemini free tier allows 15 RPM, let's keep concurrency/limits safe
      duration: 60000,
    },
  });

  jobMatchQueue.on('completed', (job) => logger.info(`✅ Job match completed: ${job.id}`));
  jobMatchQueue.on('failed', (job, err) => logger.error(`❌ Job match failed: ${job.id}`, err.message));

  return jobMatchQueue;
}

module.exports = { getJobMatchQueue, get jobMatchQueue() { return getJobMatchQueue(); } };
