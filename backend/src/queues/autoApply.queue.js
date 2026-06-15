// src/queues/autoApply.queue.js
const Bull = require('bull');
const env = require('../config/env');
const logger = require('../utils/logger');

let autoApplyQueue = null;

function getAutoApplyQueue() {
  if (autoApplyQueue) return autoApplyQueue;

  autoApplyQueue = new Bull('auto-apply', {
    redis: env.REDIS_URL,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 10000 },
      timeout: 120000, // 2 minute timeout per apply
      removeOnComplete: 500,
      removeOnFail: 200,
    },
    // Limit concurrent Playwright browsers (resource intensive)
    settings: { maxStalledCount: 1 },
  });

  autoApplyQueue.on('completed', (job) => logger.info(`✅ Auto-apply completed: ${job.id}`));
  autoApplyQueue.on('failed', (job, err) => logger.error(`❌ Auto-apply failed: ${job.id}`, err.message));
  autoApplyQueue.on('stalled', (job) => logger.warn(`⚠️ Auto-apply stalled: ${job}`));

  return autoApplyQueue;
}

module.exports = { getAutoApplyQueue, get autoApplyQueue() { return getAutoApplyQueue(); } };
