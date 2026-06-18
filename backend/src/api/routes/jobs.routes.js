// src/api/routes/jobs.routes.js
const express = require('express');
const { z } = require('zod');
const prisma = require('../../db/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const jobService = require('../../services/job.service');
const applicationService = require('../../services/application.service');
const resumeService = require('../../services/resume.service');

const router = express.Router();

// GET /api/jobs/public-stats — Get public job counts
router.get(
  '/public-stats',
  asyncHandler(async (req, res) => {
    const totalJobs = await prisma.job.count({ where: { is_active: true } });
    res.json({
      success: true,
      data: { total_jobs: totalJobs },
    });
  })
);

// GET /api/jobs — Get recommended jobs for user
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, min_score = 50, job_type, location, source, saved } = req.query;

    const result = await jobService.getRecommendedJobs(req.user.id, {
      page: Number(page),
      limit: Number(limit),
      min_score: Number(min_score),
      job_type,
      location,
      source,
      saved_only: saved === 'true',
    });

    // Mark as seen
    const matchIds = result.jobs.map((m) => m.id);
    if (matchIds.length > 0) {
      await prisma.jobMatch.updateMany({
        where: { id: { in: matchIds }, is_seen: false },
        data: { is_seen: true },
      });
    }

    res.json({
      success: true,
      data: result.jobs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.ceil(result.total / result.limit),
      },
    });
  }),
);

// GET /api/jobs/:id — Get single job detail
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) throw ApiError.notFound('Job not found');

    // Get match for this user if exists
    const match = await prisma.jobMatch.findFirst({
      where: { job_id: req.params.id, user_id: req.user.id },
    });

    res.json({ success: true, data: { ...job, match } });
  }),
);

// POST /api/jobs/:id/save — Save or unsave a job
router.post(
  '/:id/save',
  authenticate,
  asyncHandler(async (req, res) => {
    const match = await prisma.jobMatch.findFirst({
      where: { job_id: req.params.id, user_id: req.user.id },
    });

    if (!match) throw ApiError.notFound('Job match not found');

    const updated = await prisma.jobMatch.update({
      where: { id: match.id },
      data: { is_saved: !match.is_saved },
    });

    res.json({
      success: true,
      data: { is_saved: updated.is_saved },
      message: updated.is_saved ? 'Job saved' : 'Job unsaved',
    });
  }),
);

// POST /api/jobs/:id/apply — Manually trigger apply
router.post(
  '/:id/apply',
  authenticate,
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) throw ApiError.notFound('Job not found');

    const resume = await resumeService.getActiveResume(req.user.id);
    if (!resume) throw ApiError.badRequest('Please upload a resume first');

    const match = await prisma.jobMatch.findFirst({
      where: { job_id: req.params.id, user_id: req.user.id },
    });

    const { exceeded } = await applicationService.checkDailyLimit(req.user.id);
    if (exceeded) throw ApiError.tooMany('Daily application limit reached');

    const application = await applicationService.createApplication(
      req.user.id,
      job.id,
      resume.id,
      match?.id || null,
      'MANUAL',
    );

    // Enqueue auto-apply job
    try {
      const { autoApplyQueue } = require('../../queues/autoApply.queue');
      await autoApplyQueue.add('apply', { applicationId: application.id }, { attempts: 2, backoff: 5000 });
    } catch (queueErr) {
      // Queue may not be available in dev — that's ok
    }

    res.status(201).json({
      success: true,
      message: 'Application queued',
      data: application,
    });
  }),
);

// POST /api/jobs/refresh — Trigger fresh job fetch
router.post(
  '/refresh',
  authenticate,
  asyncHandler(async (req, res) => {
    const prefs = await prisma.preference.findUnique({
      where: { user_id: req.user.id },
    });

    if (!prefs || prefs.target_roles.length === 0) {
      throw ApiError.badRequest('Please set your job preferences first');
    }

    // Enqueue job fetch
    try {
      const { jobFetchQueue } = require('../../queues/jobFetch.queue');
      await jobFetchQueue.add('fetch', { userId: req.user.id, preferences: prefs }, { jobId: `refresh-${req.user.id}` });
    } catch {
      // Fallback: fetch synchronously
      await jobService.fetchJobsForUser(prefs);
    }

    res.json({ success: true, message: 'Job refresh triggered' });
  }),
);

// POST /api/jobs/:id/ab-test — Compare match scores of all user's resumes against this job
router.post(
  '/:id/ab-test',
  authenticate,
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) throw ApiError.notFound('Job not found');

    const resumes = await prisma.resume.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });

    if (resumes.length === 0) {
      throw ApiError.badRequest('No resumes found. Please upload at least one resume.');
    }

    const { scoreJobMatch } = require('../../ai/jobMatcher');
    const results = [];

    for (const resume of resumes) {
      // Find existing match
      let match = await prisma.jobMatch.findUnique({
        where: {
          user_id_job_id_resume_id: {
            user_id: req.user.id,
            job_id: job.id,
            resume_id: resume.id,
          },
        },
      });

      if (!match) {
        try {
          const matchResult = await scoreJobMatch(resume.parsed_data, job);
          match = await prisma.jobMatch.create({
            data: {
              user_id: req.user.id,
              job_id: job.id,
              resume_id: resume.id,
              match_score: matchResult.match_score,
              match_reasons: matchResult,
            },
          });
        } catch (err) {
          logger.error(`A/B testing match scoring failed for resume ${resume.id}:`, err.message);
          results.push({
            resumeId: resume.id,
            resumeLabel: resume.label || resume.file_name,
            success: false,
            error: err.message,
          });
          continue;
        }
      }

      results.push({
        resumeId: resume.id,
        resumeLabel: resume.label || resume.file_name,
        isActive: resume.is_active,
        success: true,
        matchScore: match.match_score,
        matchReasons: match.match_reasons,
      });
    }

    res.json({
      success: true,
      data: {
        job,
        results,
      },
    });
  }),
);

module.exports = router;
