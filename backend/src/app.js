// src/app.js — Main Express application
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const logger = require('./utils/logger');
const errorHandler = require('./api/middlewares/errorHandler.middleware');

// Routes
const authRoutes = require('./api/routes/auth.routes');
const resumeRoutes = require('./api/routes/resume.routes');
const preferencesRoutes = require('./api/routes/preferences.routes');
const jobsRoutes = require('./api/routes/jobs.routes');
const applicationsRoutes = require('./api/routes/applications.routes');
const schedulesRoutes = require('./api/routes/schedules.routes');
const dashboardRoutes = require('./api/routes/dashboard.routes');
const notificationsRoutes = require('./api/routes/notifications.routes');
const profileRoutes = require('./api/routes/profile.routes');


const app = express();

// ── Security & Middleware ────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
const ALLOWED_ORIGINS = [
  env.FRONTEND_URL,
  'http://localhost:3001',
  'https://aipilot-dusky.vercel.app',
  'https://aipilot-business-analytics-ai.vercel.app',
  'https://aipilot-pt6182086-8814-business-analytics-ai.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
      if (!allowed) return false;
      return origin.toLowerCase().startsWith(allowed.toLowerCase()) || 
             allowed.toLowerCase().startsWith(origin.toLowerCase());
    }) || origin.toLowerCase().includes('vercel.app') || 
          origin.toLowerCase().includes('localhost');
          
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  message: { success: false, error: 'Too many requests' },
}));

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  let linkedInHealth = { streak: 0, status: 'OK' };
  try {
    const { getLinkedInHealth } = require('./services/job.service');
    linkedInHealth = getLinkedInHealth();
  } catch (_) {}

  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date(),
    scrapers: {
      linkedin: linkedInHealth,
    },
  });
});

// ── Bull Board (Queue Monitor UI) ───────────────────────────
try {
  const { createBullBoard } = require('@bull-board/api');
  const { BullAdapter } = require('@bull-board/api/bullAdapter');
  const { ExpressAdapter } = require('@bull-board/express');
  const basicAuth = require('express-basic-auth');

  const { getJobFetchQueue } = require('./queues/jobFetch.queue');
  const { getJobMatchQueue } = require('./queues/jobMatch.queue');
  const { getAutoApplyQueue } = require('./queues/autoApply.queue');

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullAdapter(getJobFetchQueue()),
      new BullAdapter(getJobMatchQueue()),
      new BullAdapter(getAutoApplyQueue()),
    ],
    serverAdapter,
  });

  // Protect with basic auth
  app.use(
    '/admin/queues',
    basicAuth({
      users: { [env.BULL_BOARD_USERNAME]: env.BULL_BOARD_PASSWORD },
      challenge: true,
    }),
    serverAdapter.getRouter(),
  );

  logger.info('📊 Bull Board available at /admin/queues');
} catch (err) {
  logger.warn('Bull Board not initialized:', err.message);
}

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/profile', profileRoutes);


// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
async function startServer() {
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 ApplyAI Backend running on port ${env.PORT}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
    logger.info(`   Health: http://localhost:${env.PORT}/health`);
    logger.info(`   Queue UI: http://localhost:${env.PORT}/admin/queues`);
  });

  // Attach WebSocket server
  const { initWebSocketServer } = require('./services/websocket.service');
  initWebSocketServer(server);

  // Initialize workers (non-blocking to server startup)
  (async () => {
    try {
      const { getJobFetchQueue } = require('./queues/jobFetch.queue');
      const { getJobMatchQueue } = require('./queues/jobMatch.queue');
      const { getAutoApplyQueue } = require('./queues/autoApply.queue');
      const { registerJobFetchWorker } = require('./workers/jobFetch.worker');
      const { registerJobMatchWorker } = require('./workers/jobMatch.worker');
      const { registerAutoApplyWorker } = require('./workers/autoApply.worker');

      registerJobFetchWorker(getJobFetchQueue());
      registerJobMatchWorker(getJobMatchQueue());
      registerAutoApplyWorker(getAutoApplyQueue());

      // Schedule periodic job fetching
      const { schedulePeriodicFetch } = require('./queues/jobFetch.queue');
      await schedulePeriodicFetch();

      logger.info('✅ All workers registered');
    } catch (err) {
      logger.error('Workers not started (Redis may not be available):', err.message);

      // FALLBACK: If Redis is unavailable, start a setInterval loop to fetch & match jobs every hour
      logger.info('⏰ Starting local fallback setInterval loop for hourly fetches');
      let isFetchRunning = false; // Lock: prevents overlapping concurrent fetch runs

      setInterval(async () => {
        if (isFetchRunning) {
          logger.warn('⏰ Skipping fallback fetch tick — previous run still in progress');
          return;
        }
        isFetchRunning = true;
        logger.info('⏰ Running fallback periodic hourly job fetch');
        try {
          const prisma = require('./db/prisma');
          const jobService = require('./services/job.service');
          const { scoreJobMatch } = require('./ai/jobMatcher');

          const users = await prisma.user.findMany({
            include: { preferences: true },
            where: { preferences: { isNot: null } },
          });
          
          for (const user of users) {
            if (!user.preferences) continue;

            // ── Step 1: Fetch jobs regardless of resume status ──
            try {
              const stats = await jobService.fetchJobsForUser(user.preferences);
              logger.info(`⏰ Fetch for ${user.email}: ${stats.created} new, ${stats.updated} refreshed`);
            } catch (fetchErr) {
              logger.error(`⏰ Fetch failed for ${user.email}:`, fetchErr.message);
            }

            // ── Step 2: Get resume — active first, then fall back to most-recent ──
            let resume = await prisma.resume.findFirst({
              where: { user_id: user.id, is_active: true },
              orderBy: { created_at: 'desc' },
            });

            if (!resume) {
              // Auto-activate the most recent resume so the user isn't stuck
              const latest = await prisma.resume.findFirst({
                where: { user_id: user.id },
                orderBy: { created_at: 'desc' },
              });
              if (latest) {
                await prisma.resume.update({ where: { id: latest.id }, data: { is_active: true } });
                resume = { ...latest, is_active: true };
                logger.info(`⏰ Auto-activated resume ${latest.id} for ${user.email}`);
              }
            }

            if (!resume || !resume.parsed_data) {
              logger.warn(`⏰ No resume with parsed data for ${user.email} — skipping match step`);
              continue;
            }

            // ── Step 3: Score unmatched jobs (paginated, up to 100 per cycle) ──
            const unmatched = await prisma.job.findMany({
              where: {
                is_active: true,
                job_matches: { none: { user_id: user.id } },
              },
              orderBy: { created_at: 'desc' },
              take: 100,
            });

            logger.info(`⏰ Scoring ${unmatched.length} unmatched jobs for ${user.email}`);
            let matched = 0;
            for (const j of unmatched) {
              try {
                const matchResult = await scoreJobMatch(resume.parsed_data, j);
                await prisma.jobMatch.create({
                  data: {
                    user_id: user.id,
                    job_id: j.id,
                    resume_id: resume.id,
                    match_score: matchResult.match_score,
                    match_reasons: matchResult,
                  },
                });
                matched++;
              } catch (matchErr) {
                logger.error(`⏰ Match failed for job ${j.id}:`, matchErr.message);
              }
            }
            logger.info(`⏰ Created ${matched} new matches for ${user.email}`);

            // ── Broadcast real-time update to connected clients ──
            try {
              const { broadcastToUser } = require('./services/websocket.service');
              broadcastToUser(user.id, 'jobs-refreshed', {
                newMatches: matched,
                newJobs: stats?.created || 0,
                timestamp: new Date().toISOString(),
              });
              broadcastToUser(user.id, 'stats-updated', { source: 'hourly-fetch' });
              logger.info(`📡 Broadcasted jobs-refreshed to ${user.email}: ${matched} new matches`);
            } catch (wsErr) {
              logger.warn('WS broadcast failed (non-fatal):', wsErr.message);
            }
          } // end for (const user of users)
        } catch (fetchErr) {
          logger.error('Fallback periodic fetch failed:', fetchErr.message);
        } finally {
          isFetchRunning = false; // Always release the lock
        }
      }, 60 * 60 * 1000); // 1 hour
    }
  })();
}

startServer();

module.exports = app;
