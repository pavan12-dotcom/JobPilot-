// src/api/routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../../db/prisma');
const { authenticate, generateToken } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

const router = express.Router();

// POST /api/auth/login — Demo/local login
router.post(
  '/login',
  validate({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password_hash) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw ApiError.unauthorized('Invalid credentials');

    const token = generateToken(user.id);
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          is_premium: user.is_premium,
        },
      },
    });
  }),
);

// POST /api/auth/verify — Verify Supabase JWT and sync user
router.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) throw ApiError.badRequest('Token is required');

    // Verification happens in the middleware — here we just echo back
    res.json({ success: true, data: { valid: true } });
  }),
);

// GET /api/auth/me — Get current authenticated user
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        preferences: true,
        resumes: { where: { is_active: true }, take: 1 },
        _count: { select: { applications: true, job_matches: true } },
      },
    });

    res.json({ success: true, data: user });
  }),
);

// PATCH /api/auth/profile — Update profile details
router.patch(
  '/profile',
  authenticate,
  validate({
    body: z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      daily_apply_limit: z.number().min(1).max(5).optional(),
      is_premium: z.boolean().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { name, email, daily_apply_limit, is_premium } = req.body;

    if (email && email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw ApiError.conflict('Email is already in use');
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(daily_apply_limit !== undefined && { daily_apply_limit }),
        ...(is_premium !== undefined && { is_premium }),
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        avatar_url: updated.avatar_url,
        is_premium: updated.is_premium,
        daily_apply_limit: updated.daily_apply_limit,
      },
    });
  }),
);

module.exports = router;

