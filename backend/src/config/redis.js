// src/config/redis.js
const IORedis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  redisClient = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for Bull
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redisClient.on('connect', () => logger.info('✅ Redis connected'));
  redisClient.on('error', (err) => logger.error('Redis error:', err));

  return redisClient;
}

// Connection factory for Bull queues (each queue needs its own connection)
function createRedisConnection() {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

module.exports = { getRedisClient, createRedisConnection };
