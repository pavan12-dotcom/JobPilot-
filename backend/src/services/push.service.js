// src/services/push.service.js
// Web Push notifications via VAPID (no Firebase/APNs needed)
const webpush = require('web-push');
const env     = require('../config/env');
const prisma  = require('../db/prisma');
const logger  = require('../utils/logger');

// ── Configure VAPID ──────────────────────────────────────────────────────────
let pushReady = false;

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    env.VAPID_EMAIL,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  pushReady = true;
  logger.info('🔔 Web Push (VAPID) configured');
} else {
  logger.warn('⚠️  VAPID keys not set — push notifications disabled');
}

// ── Send push to a single subscription object ─────────────────────────────────
async function sendPush(subscription, payload) {
  if (!pushReady) return false;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    // 410 = subscription expired, 404 = not found → remove from DB
    if (err.statusCode === 410 || err.statusCode === 404) {
      logger.warn(`Push subscription expired — removing (endpoint: ${subscription.endpoint?.slice(-40)})`);
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      }).catch(() => {});
    } else {
      logger.error('Push send error:', err.message);
    }
    return false;
  }
}

// ── Push to ALL subscriptions of a user ──────────────────────────────────────
async function pushToUser(userId, payload) {
  if (!pushReady) {
    logger.debug(`[MOCK PUSH] User ${userId}: ${payload.title} — ${payload.body}`);
    return;
  }

  const subs = await prisma.pushSubscription.findMany({ where: { user_id: userId } });
  if (subs.length === 0) return;

  await Promise.allSettled(
    subs.map(sub => sendPush({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    }, payload))
  );
}

// ── Notification payloads ─────────────────────────────────────────────────────

async function pushNewJobMatch(userId, job, score) {
  await pushToUser(userId, {
    title: `🎯 ${score}% Match Found!`,
    body: `${job.title} at ${job.company} — ${job.location}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: `match-${job.id}`,
    url: '/?tab=search',
    data: { type: 'job_match', jobId: job.id },
  });
}

async function pushApplicationApplied(userId, job) {
  await pushToUser(userId, {
    title: '✅ Auto-Applied Successfully!',
    body: `${job.title} at ${job.company}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: `applied-${job.id}`,
    url: '/?tab=saved',
    data: { type: 'applied', jobId: job.id },
  });
}

async function pushInterviewScheduled(userId, job) {
  await pushToUser(userId, {
    title: '📅 Interview Invite!',
    body: `${job.title} at ${job.company} wants to schedule an interview`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: `interview-${job.id}`,
    url: '/?tab=saved',
    data: { type: 'interview', jobId: job.id },
  });
}

async function pushOfferReceived(userId, job) {
  await pushToUser(userId, {
    title: '🎉 Offer Received!',
    body: `${job.company} has sent you an offer for ${job.title}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: `offer-${job.id}`,
    url: '/?tab=saved',
    data: { type: 'offer', jobId: job.id },
  });
}

module.exports = {
  pushNewJobMatch,
  pushApplicationApplied,
  pushInterviewScheduled,
  pushOfferReceived,
  VAPID_PUBLIC_KEY: env.VAPID_PUBLIC_KEY,
};
