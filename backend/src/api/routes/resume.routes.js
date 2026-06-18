// src/api/routes/resume.routes.js
const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const prisma = require('../../db/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const resumeService = require('../../services/resume.service');
const { sendResumeParsed } = require('../../services/notification.service');

const router = express.Router();

// Multer config: memory storage, PDF only, max 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(ApiError.badRequest('Only PDF files are allowed'));
  },
});

// POST /api/resume/upload
router.post(
  '/upload',
  authenticate,
  upload.single('resume'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No file uploaded');

    const { resume, parsedData } = await resumeService.uploadAndParseResume(req.file, req.user.id, req.body.label);

    // Send welcome email (non-blocking)
    sendResumeParsed(req.user.email, req.user.name, parsedData.skills || []).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      data: resume,
    });
  }),
);

// GET /api/resume — Get active resume
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const resume = await resumeService.getActiveResume(req.user.id);
    if (!resume) throw ApiError.notFound('No active resume found');
    res.json({ success: true, data: resume });
  }),
);

// GET /api/resume/all — Get all resumes
router.get(
  '/all',
  authenticate,
  asyncHandler(async (req, res) => {
    const resumes = await prisma.resume.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: resumes });
  }),
);

// DELETE /api/resume/:id
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!resume) throw ApiError.notFound('Resume not found');

    await prisma.resume.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Resume deleted' });
  }),
);

// POST /api/resume/:id/reparse — Re-run Gemini parser
router.post(
  '/:id/reparse',
  authenticate,
  asyncHandler(async (req, res) => {
    const resume = await resumeService.reparseResume(req.params.id, req.user.id);
    res.json({ success: true, message: 'Resume reparsed', data: resume });
  }),
);

// POST /api/resume/:id/active — Set resume as active
router.post(
  '/:id/active',
  authenticate,
  asyncHandler(async (req, res) => {
    const resume = await resumeService.setActiveResume(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Active resume updated successfully',
      data: resume,
    });
  }),
);

// PATCH /api/resume/:id — Update resume details (e.g. label, parsed_data)
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { label, parsed_data } = req.body;
    if (label === undefined && parsed_data === undefined) {
      throw ApiError.badRequest('Label or parsed_data is required');
    }

    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!resume) throw ApiError.notFound('Resume not found');

    const updated = await prisma.resume.update({
      where: { id: req.params.id },
      data: {
        ...(label !== undefined && { label }),
        ...(parsed_data !== undefined && {
          parsed_data: {
            ...(typeof resume.parsed_data === 'object' && resume.parsed_data ? resume.parsed_data : {}),
            ...parsed_data,
          },
        }),
      },
    });

    res.json({
      success: true,
      message: 'Resume updated successfully',
      data: updated,
    });
  }),
);

module.exports = router;
