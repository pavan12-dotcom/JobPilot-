// src/api/routes/applications.routes.js
const express = require('express');
const { z } = require('zod');
const prisma = require('../../db/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const applicationService = require('../../services/application.service');

const router = express.Router();

// GET /api/applications — List all applications
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { status, method, page = 1, limit = 20 } = req.query;

    const where = {
      user_id: req.user.id,
      ...(status && { status }),
      ...(method && { application_method: method }),
    };

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: { select: { id: true, title: true, company: true, location: true, apply_url: true } },
          match: { select: { match_score: true } },
          _count: { select: { logs: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.application.count({ where }),
    ]);

    res.json({
      success: true,
      data: applications,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  }),
);

// GET /api/applications/:id — Get application with full logs
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const application = await applicationService.getApplicationWithLogs(req.params.id, req.user.id);
    res.json({ success: true, data: application });
  }),
);

// PATCH /api/applications/:id/status — Update status manually
router.patch(
  '/:id/status',
  authenticate,
  validate({
    body: z.object({
      status: z.enum(['QUEUED', 'APPLYING', 'APPLIED', 'FAILED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']),
      notes: z.string().optional(),
      follow_up_date: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { status, notes, follow_up_date } = req.body;
    const updated = await applicationService.updateStatus(req.params.id, req.user.id, status, { notes });

    if (follow_up_date) {
      await prisma.application.update({
        where: { id: req.params.id },
        data: { follow_up_date: new Date(follow_up_date) },
      });
    }

    res.json({ success: true, data: updated });
  }),
);

// POST /api/applications/:id/note — Add note
router.post(
  '/:id/note',
  authenticate,
  validate({ body: z.object({ note: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const updated = await applicationService.addNote(req.params.id, req.user.id, req.body.note);
    res.json({ success: true, data: updated });
  }),
);

// DELETE /api/applications/:id — Withdraw application
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const updated = await applicationService.updateStatus(req.params.id, req.user.id, 'WITHDRAWN');
    res.json({ success: true, message: 'Application withdrawn', data: updated });
  }),
);

module.exports = router;
