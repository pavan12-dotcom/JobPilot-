// src/api/routes/dashboard.routes.js
const express = require('express');
const prisma = require('../../db/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const { callGemini } = require('../../config/gemini');
const env = require('../../config/env');

const router = express.Router();

// GET /api/dashboard/stats — KPI stats
router.get(
  '/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalApplied, interviews, offers, matchedToday, totalJobs, pendingToday] = await Promise.all([
      prisma.application.count({ where: { user_id: userId, status: 'APPLIED' } }),
      prisma.application.count({ where: { user_id: userId, status: 'INTERVIEW' } }),
      prisma.application.count({ where: { user_id: userId, status: 'OFFER' } }),
      prisma.jobMatch.count({ where: { user_id: userId, created_at: { gte: today } } }),
      prisma.application.count({ where: { user_id: userId, status: { notIn: ['WITHDRAWN', 'REJECTED'] } } }),
      prisma.application.count({
        where: { user_id: userId, created_at: { gte: today }, status: { in: ['APPLIED', 'QUEUED', 'APPLYING'] } },
      }),
    ]);

    const successRate =
      totalApplied > 0 ? Math.round(((interviews + offers) / totalApplied) * 100) : 0;

    res.json({
      success: true,
      data: {
        total_applied: totalApplied,
        interviews,
        offers,
        success_rate: successRate,
        jobs_matched_today: matchedToday,
        applied_today: pendingToday,
        active_applications: totalJobs,
      },
    });
  }),
);

// GET /api/dashboard/activity — Recent activity feed
router.get(
  '/activity',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || 15;

    // Recent applications
    const recentApplications = await prisma.application.findMany({
      where: { user_id: userId },
      include: { job: { select: { title: true, company: true } } },
      orderBy: { updated_at: 'desc' },
      take: Math.floor(limit / 2),
    });

    // Recent matches
    const recentMatches = await prisma.jobMatch.findMany({
      where: { user_id: userId },
      include: { job: { select: { title: true, company: true } } },
      orderBy: { created_at: 'desc' },
      take: Math.floor(limit / 2),
    });

    // Merge and format activity feed
    const activity = [
      ...recentApplications.map((app) => ({
        id: app.id,
        type: 'application',
        title: `Applied to ${app.job.title} at ${app.job.company}`,
        subtitle: `Status: ${app.status} • ${app.application_method}`,
        status: app.status,
        timestamp: app.updated_at,
      })),
      ...recentMatches.map((match) => ({
        id: match.id,
        type: 'match',
        title: `New match: ${match.job.title} at ${match.job.company}`,
        subtitle: `${match.match_score}% match score`,
        score: match.match_score,
        timestamp: match.created_at,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

    res.json({ success: true, data: activity });
  }),
);

// GET /api/dashboard/insights — AI-generated insights
router.get(
  '/insights',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const [stats, recentApps] = await Promise.all([
      prisma.application.groupBy({
        by: ['status'],
        where: { user_id: userId },
        _count: { status: true },
      }),
      prisma.application.findMany({
        where: { user_id: userId },
        include: { job: true, match: true },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
    ]);

    // If no Gemini API key, return static insights
    if (!env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        data: {
          insights: [
            { type: 'tip', message: 'Apply to jobs with 80%+ match scores for better interview rates.' },
            { type: 'tip', message: 'Customize your resume for each application to increase chances.' },
            { type: 'tip', message: 'Enable auto-apply to submit applications while you focus on interview prep.' },
          ],
          generated_at: new Date(),
        },
      });
    }

    const statusSummary = stats.map((s) => `${s.status}: ${s._count.status}`).join(', ');
    const topCompanies = recentApps.map((a) => a.job.company).slice(0, 5).join(', ');

    const prompt = `Based on this job seeker's application data, provide 3 actionable insights to improve their job search.

Application stats: ${statusSummary}
Recent companies applied to: ${topCompanies}
Total applications: ${recentApps.length}

Return JSON array with 3 objects: [{ "type": "tip"|"warning"|"positive", "message": "actionable insight" }]`;

    let insights;
    try {
      insights = await callGemini(prompt, 'You are a career coach. Return only valid JSON.', true);
    } catch {
      insights = [{ type: 'tip', message: 'Keep applying consistently — most job seekers get interviews after 20+ applications.' }];
    }

    res.json({
      success: true,
      data: { insights: Array.isArray(insights) ? insights : [insights], generated_at: new Date() },
    });
  }),
);

module.exports = router;
