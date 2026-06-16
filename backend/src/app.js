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
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date() });
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
async function startServer() {
  app.listen(env.PORT, () => {
    logger.info(`🚀 ApplyAI Backend running on port ${env.PORT}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
    logger.info(`   Health: http://localhost:${env.PORT}/health`);
    logger.info(`   Queue UI: http://localhost:${env.PORT}/admin/queues`);
  });

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
    }
  })();
}

startServer();

module.exports = app;
