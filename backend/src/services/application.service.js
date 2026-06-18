// src/services/application.service.js
const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Create a new application (manual or auto)
 */
async function createApplication(userId, jobId, resumeId, matchId, method = 'MANUAL') {
  // Check if already applied
  const existing = await prisma.application.findFirst({
    where: { user_id: userId, job_id: jobId },
  });

  if (existing) {
    throw ApiError.conflict('You have already applied to this job');
  }

  const application = await prisma.application.create({
    data: {
      user_id: userId,
      job_id: jobId,
      resume_id: resumeId,
      match_id: matchId,
      status: 'QUEUED',
      application_method: method,
    },
    include: { job: true },
  });

  await logEvent(application.id, 'Application created', { method });
  return application;
}

/**
 * Update application status with validation
 */
async function updateStatus(applicationId, userId, newStatus, extra = {}) {
  const where = { id: applicationId };
  if (userId !== 'system') {
    where.user_id = userId;
  }
  const application = await prisma.application.findFirst({
    where,
    include: { user: true, job: true }
  });

  if (!application) throw ApiError.notFound('Application not found');

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: newStatus,
      ...(newStatus === 'APPLIED' && { applied_at: new Date() }),
      ...(extra.failure_reason && { failure_reason: extra.failure_reason }),
      ...(extra.screenshot_url && { screenshot_url: extra.screenshot_url }),
      ...(extra.cover_letter && { cover_letter: extra.cover_letter }),
    },
    include: { job: true, logs: { orderBy: { created_at: 'asc' } } },
  });

  await logEvent(applicationId, `Status changed to ${newStatus}`, extra);

  // Broadcast WebSocket update
  try {
    const { broadcastToUser } = require('./websocket.service');
    broadcastToUser(updated.user_id, 'application-status-updated', {
      applicationId,
      status: newStatus,
      extra,
      application: updated
    });
    broadcastToUser(updated.user_id, 'stats-updated', {});
  } catch (wsErr) {
    logger.error('Failed to broadcast status update: ' + wsErr.message);
  }

  // Send email and push notification on applied response statuses
  if (['INTERVIEW', 'OFFER', 'REJECTED'].includes(newStatus)) {
    const actualUserId = application.user_id;
    const user = application.user || await prisma.user.findUnique({ where: { id: actualUserId } });

    if (user) {
      // 1. Email notification
      const notificationService = require('./notification.service');
      notificationService.sendApplicationStatusUpdate(user.email, user.name, updated.job, newStatus, extra.notes || '').catch(err => {
        logger.error('Failed to send status update email:', err.message);
      });

      // 2. Push notification
      const pushService = require('./push.service');
      if (newStatus === 'INTERVIEW') {
        pushService.pushInterviewScheduled(actualUserId, updated.job).catch(err => {
          logger.error('Failed to send interview push:', err.message);
        });
      } else if (newStatus === 'OFFER') {
        pushService.pushOfferReceived(actualUserId, updated.job).catch(err => {
          logger.error('Failed to send offer push:', err.message);
        });
      }
    }
  }

  return updated;
}

/**
 * Add a note to an application
 */
async function addNote(applicationId, userId, note) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, user_id: userId },
  });

  if (!application) throw ApiError.notFound('Application not found');

  return prisma.application.update({
    where: { id: applicationId },
    data: { notes: note },
  });
}

/**
 * Log an application event
 */
async function logEvent(applicationId, event, metadata = {}, screenshotUrl = null) {
  const log = await prisma.applicationLog.create({
    data: {
      application_id: applicationId,
      event,
      metadata,
      screenshot_url: screenshotUrl,
    },
  });

  try {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { user_id: true }
    });
    if (app) {
      const { broadcastToUser } = require('./websocket.service');
      broadcastToUser(app.user_id, 'application-log-added', {
        applicationId,
        log
      });
    }
  } catch (wsErr) {
    logger.error('Failed to broadcast application log: ' + wsErr.message);
  }

  return log;
}

/**
 * Get application with full logs
 */
async function getApplicationWithLogs(applicationId, userId) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, user_id: userId },
    include: {
      job: true,
      resume: true,
      match: true,
      logs: { orderBy: { created_at: 'asc' } },
    },
  });

  if (!application) throw ApiError.notFound('Application not found');
  return application;
}

/**
 * Get daily application count for a user
 */
async function getDailyCount(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.application.count({
    where: {
      user_id: userId,
      created_at: { gte: today },
      status: { in: ['APPLIED', 'APPLYING', 'QUEUED'] },
    },
  });
}

/**
 * Check if user has hit daily apply limit
 */
async function checkDailyLimit(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const count = await getDailyCount(userId);
  return { count, limit: user.daily_apply_limit, exceeded: count >= user.daily_apply_limit };
}

/**
 * Update draft fields (answers, form_data, cover_letter)
 */
async function updateDraft(applicationId, userId, { answers, form_data, cover_letter }) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, user_id: userId }
  });

  if (!application) {
    const ApiError = require('../utils/ApiError');
    throw ApiError.notFound('Application not found');
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      ...(answers !== undefined && { answers }),
      ...(form_data !== undefined && { form_data }),
      ...(cover_letter !== undefined && { cover_letter })
    }
  });

  await logEvent(applicationId, 'Draft updated by user');
  return updated;
}

/**
 * Approve draft application and queue it for submission
 */
async function approveApplication(applicationId, userId) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, user_id: userId },
  });

  if (!application) {
    const ApiError = require('../utils/ApiError');
    throw ApiError.notFound('Application not found');
  }

  const ApiError = require('../utils/ApiError');
  if (application.status !== 'READY_FOR_REVIEW') {
    throw ApiError.badRequest('Only applications in READY_FOR_REVIEW status can be approved');
  }

  // Update status to QUEUED
  const updated = await updateStatus(applicationId, userId, 'QUEUED');

  // Enqueue Playwright submission worker task
  const { getAutoApplyQueue } = require('../queues/autoApply.queue');
  const autoApplyQueue = getAutoApplyQueue();
  await autoApplyQueue.add(
    'submit',
    { applicationId },
    { attempts: 2, backoff: 10000 }
  );

  await logEvent(applicationId, 'Application approved and queued for submission');
  return updated;
}

module.exports = {
  createApplication,
  updateStatus,
  addNote,
  logEvent,
  getApplicationWithLogs,
  getDailyCount,
  checkDailyLimit,
  updateDraft,
  approveApplication,
};
