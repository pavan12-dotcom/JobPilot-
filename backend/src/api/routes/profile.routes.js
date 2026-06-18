// src/api/routes/profile.routes.js
const express = require('express');
const prisma = require('../../db/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

// GET /api/profile — Get active user profile details
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    let profile = await prisma.profile.findUnique({
      where: { user_id: userId }
    });

    // Lazy initialization of profile if it doesn't exist
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          user_id: userId,
          phone: '',
          country: '',
          state: '',
          city: '',
          linkedin_url: '',
          github_url: '',
          portfolio_url: '',
          current_title: '',
          years_experience: 0,
          skills: [],
          certifications: [],
          previous_companies: [],
          expected_salary: 0,
          notice_period: '',
          preferred_industries: [],
          work_authorization: '',
          visa_status: '',
          sponsorship_required: false,
          relocation_preference: '',
          cover_letter_template: ''
        }
      });
    }

    res.json({ success: true, data: profile });
  })
);

// POST /api/profile — Update user profile details
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = req.body;

    // Remove immutable user_id and id if passed by accident
    delete data.id;
    delete data.user_id;

    // Convert numeric fields if passed as strings
    if (data.years_experience !== undefined) {
      data.years_experience = data.years_experience !== null ? Number(data.years_experience) : null;
    }
    if (data.expected_salary !== undefined) {
      data.expected_salary = data.expected_salary !== null ? Number(data.expected_salary) : null;
    }
    if (data.sponsorship_required !== undefined) {
      data.sponsorship_required = data.sponsorship_required === true || data.sponsorship_required === 'true';
    }

    const profile = await prisma.profile.upsert({
      where: { user_id: userId },
      update: data,
      create: {
        user_id: userId,
        ...data
      }
    });

    // Sync full name in User model if passed in name
    if (data.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: data.name }
      }).catch(() => {});
    }

    res.json({ success: true, data: profile });
  })
);

module.exports = router;
