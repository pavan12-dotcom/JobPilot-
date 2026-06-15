// src/api/routes/preferences.routes.js
const express = require('express');
const { z } = require('zod');
const prisma = require('../../db/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

const preferencesSchema = z.object({
  target_roles: z.array(z.string()).optional(),
  target_locations: z.array(z.string()).optional(),
  min_salary: z.number().nullable().optional(),
  max_salary: z.number().nullable().optional(),
  job_types: z.array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE', 'INTERNSHIP'])).optional(),
  experience_level: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  blacklisted_companies: z.array(z.string()).optional(),
  preferred_companies: z.array(z.string()).optional(),
  auto_apply_enabled: z.boolean().optional(),
  min_match_score: z.number().min(0).max(100).optional(),
});

// GET /api/preferences
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const prefs = await prisma.preference.findUnique({
      where: { user_id: req.user.id },
    });

    if (!prefs) {
      // Return defaults for new users
      return res.json({
        success: true,
        data: {
          user_id: req.user.id,
          target_roles: [],
          target_locations: [],
          min_salary: null,
          max_salary: null,
          job_types: [],
          experience_level: 'MID',
          blacklisted_companies: [],
          preferred_companies: [],
          auto_apply_enabled: false,
          min_match_score: 70,
        },
      });
    }

    res.json({ success: true, data: prefs });
  }),
);

// PUT /api/preferences — Update all preferences
router.put(
  '/',
  authenticate,
  validate({ body: preferencesSchema }),
  asyncHandler(async (req, res) => {
    const prefs = await prisma.preference.upsert({
      where: { user_id: req.user.id },
      update: req.body,
      create: { user_id: req.user.id, ...req.body },
    });

    res.json({ success: true, data: prefs });
  }),
);

// PATCH /api/preferences/toggle-auto — Toggle auto-apply
router.patch(
  '/toggle-auto',
  authenticate,
  asyncHandler(async (req, res) => {
    const current = await prisma.preference.findUnique({
      where: { user_id: req.user.id },
    });

    const newValue = current ? !current.auto_apply_enabled : true;

    const prefs = await prisma.preference.upsert({
      where: { user_id: req.user.id },
      update: { auto_apply_enabled: newValue },
      create: { user_id: req.user.id, auto_apply_enabled: newValue },
    });

    res.json({
      success: true,
      data: { auto_apply_enabled: prefs.auto_apply_enabled },
      message: `Auto-apply ${prefs.auto_apply_enabled ? 'enabled' : 'disabled'}`,
    });
  }),
);

module.exports = router;
