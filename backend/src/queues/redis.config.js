// src/queues/redis.config.js
// Shared Redis connection config for all Bull queues.
// Handles both standard Redis (local/Railway) and TLS Redis (Upstash).

const env = require('../config/env');

/**
 * Build a Bull-compatible Redis connection config from REDIS_URL.
 * - rediss:// URLs (Upstash, etc.) → enables TLS with rejectUnauthorized: false
 * - redis:// URLs (local, Railway internal) → plain connection
 */
function getRedisConfig() {
  const url = env.REDIS_URL || 'redis://localhost:6379';
  const isTLS = url.startsWith('rediss://');

  if (isTLS) {
    // Parse the URL for Bull's object-style config (required for TLS options)
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      username: parsed.username || 'default',
      password: decodeURIComponent(parsed.password || ''),
      tls: {
        rejectUnauthorized: false, // Required for Upstash self-signed certs
      },
    };
  }

  // Plain URL — Bull accepts this directly as a string
  return url;
}

module.exports = { getRedisConfig };
