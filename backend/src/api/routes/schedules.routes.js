// src/api/routes/schedules.routes.js
const express = require('express');
const { z } = require('zod');
const prisma = require('../../db/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const scheduleService = require('../../services/schedule.service');

const router = express.Router();

const scheduleSchema = z.object({
  name: z.string().min(1).max(100),
  cron_expression: z.string(),
  max_applications: z.number().min(1).max(50).default(5),
});

// POST /api/schedules
router.post(
  '/',
  authenticate,
  validate({ body: scheduleSchema }),
  asyncHandler(async (req, res) => {
    const schedule = await scheduleService.createSchedule(req.user.id, req.body);
    res.status(201).json({ success: true, data: schedule });
  }),
);

// GET /api/schedules
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const schedules = await prisma.schedule.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: schedules });
  }),
);

// PUT /api/schedules/:id
router.put(
  '/:id',
  authenticate,
  validate({ body: scheduleSchema.partial() }),
  asyncHandler(async (req, res) => {
    const schedule = await scheduleService.updateSchedule(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: schedule });
  }),
);

// PATCH /api/schedules/:id/toggle
router.patch(
  '/:id/toggle',
  authenticate,
  asyncHandler(async (req, res) => {
    const schedule = await scheduleService.toggleSchedule(req.params.id, req.user.id);
    res.json({
      success: true,
      data: schedule,
      message: `Schedule ${schedule.is_active ? 'resumed' : 'paused'}`,
    });
  }),
);

// DELETE /api/schedules/:id
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    await scheduleService.deleteSchedule(req.params.id, req.user.id);
    res.json({ success: true, message: 'Schedule deleted' });
  }),
);

module.exports = router;
