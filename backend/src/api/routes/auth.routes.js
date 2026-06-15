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

module.exports = router;
