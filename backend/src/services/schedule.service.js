// src/services/schedule.service.js
const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Parse cron expression to get next run time (simplified)
 * For production use node-cron or cron-parser
 */
function getNextRunTime(cronExpression) {
  try {
    // Simple calculation: next occurrence of the cron
    // For full parsing, install 'cron-parser' package
    const now = new Date();
    const parts = cronExpression.split(' ');

    if (parts.length !== 5) return null;

    const [minute, hour] = parts;
    const next = new Date();

    if (hour !== '*') next.setHours(parseInt(hour));
    if (minute !== '*') next.setMinutes(parseInt(minute));
    next.setSeconds(0);
    next.setMilliseconds(0);

    // If time has already passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  } catch {
    return null;
  }
}

/**
 * Validate a cron expression (basic)
 */
function validateCron(expression) {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw ApiError.badRequest('Invalid cron expression. Must have 5 fields: min hour day month weekday');
  }
  return true;
}

async function createSchedule(userId, data) {
  validateCron(data.cron_expression);

  const schedule = await prisma.schedule.create({
    data: {
      user_id: userId,
      name: data.name,
      cron_expression: data.cron_expression,
      max_applications: data.max_applications || 5,
      is_active: true,
      next_run: getNextRunTime(data.cron_expression),
    },
  });

  return schedule;
}

async function updateSchedule(scheduleId, userId, data) {
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, user_id: userId },
  });

  if (!schedule) throw ApiError.notFound('Schedule not found');

  if (data.cron_expression) validateCron(data.cron_expression);

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.cron_expression && {
        cron_expression: data.cron_expression,
        next_run: getNextRunTime(data.cron_expression),
      }),
      ...(data.max_applications && { max_applications: data.max_applications }),
    },
  });
}

async function toggleSchedule(scheduleId, userId) {
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, user_id: userId },
  });

  if (!schedule) throw ApiError.notFound('Schedule not found');

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: { is_active: !schedule.is_active },
  });
}

async function deleteSchedule(scheduleId, userId) {
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, user_id: userId },
  });

  if (!schedule) throw ApiError.notFound('Schedule not found');

  return prisma.schedule.delete({ where: { id: scheduleId } });
}

async function markScheduleRun(scheduleId) {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return;

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      last_run: new Date(),
      next_run: getNextRunTime(schedule.cron_expression),
    },
  });
}

module.exports = {
  createSchedule,
  updateSchedule,
  toggleSchedule,
  deleteSchedule,
  markScheduleRun,
  getNextRunTime,
};
