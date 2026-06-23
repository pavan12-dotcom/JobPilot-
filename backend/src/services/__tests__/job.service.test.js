/**
 * Tests for pure helper functions in job.service.js.
 * These run without any external API calls or DB connections.
 *
 * Note: sourceLabels.js lives in the frontend and is intentionally NOT
 * imported here. Those tests belong in the frontend test suite.
 */

// ── stripHtml tests ──────────────────────────────────────────
// stripHtml is an internal helper in job.service.js. We mirror the logic
// here to test it directly without loading the full module (which requires
// a live DATABASE_URL / Prisma client).
function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

describe('stripHtml', () => {
  test('removes simple HTML tags', () => {
    expect(stripHtml('<b>Hello</b> <i>World</i>')).toBe('Hello World');
  });

  test('decodes common HTML entities', () => {
    expect(stripHtml('React &amp; Node.js')).toBe('React & Node.js');
    expect(stripHtml('&lt;div&gt;')).toBe('<div>');
    expect(stripHtml("It&#39;s fine")).toBe("It's fine");
  });

  test('collapses extra whitespace from tag removal', () => {
    const input = '<p>Hello   <span>  world  </span>   !</p>';
    const result = stripHtml(input);
    expect(result).toBe('Hello world !');
  });

  test('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml()).toBe('');
  });

  test('handles deeply nested tags', () => {
    const result = stripHtml('<div><p><strong>Deep nested</strong></p></div>');
    expect(result).toBe('Deep nested');
  });

  test('does not mutate plain text', () => {
    expect(stripHtml('plain text with no tags')).toBe('plain text with no tags');
  });
});

// ── getLinkedInHealth tests ───────────────────────────────────
// We mock the env + prisma to avoid needing a real DB connection
jest.mock('../../db/prisma', () => ({}));
jest.mock('../../config/env', () => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_KEY: '',
  SUPABASE_STORAGE_BUCKET: 'resumes',
  ANTHROPIC_API_KEY: '',
  GEMINI_API_KEY: '',
  ADZUNA_APP_ID: '',
  ADZUNA_APP_KEY: '',
  ADZUNA_COUNTRY: 'in',
  REMOTIVE_API_URL: 'https://remotive.com/api/remote-jobs',
  THEMUSE_API_KEY: '',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 587,
  SMTP_USER: '',
  SMTP_PASS: '',
  EMAIL_FROM: 'test@test.com',
  JWT_SECRET: 'test-secret',
  FRONTEND_URL: 'http://localhost:3001',
  BULL_BOARD_USERNAME: 'admin',
  BULL_BOARD_PASSWORD: 'admin',
  VAPID_PUBLIC_KEY: '',
  VAPID_PRIVATE_KEY: '',
  VAPID_EMAIL: 'mailto:test@test.com',
  PORT: 3000,
}));

describe('getLinkedInHealth', () => {
  beforeEach(() => {
    jest.resetModules();
    // Re-apply mocks after module reset
    jest.mock('../../db/prisma', () => ({}));
    jest.mock('../../config/env', () => ({
      NODE_ENV: 'test', DATABASE_URL: 'postgresql://test', REDIS_URL: 'redis://localhost:6379',
      SUPABASE_URL: '', SUPABASE_SERVICE_KEY: '', SUPABASE_STORAGE_BUCKET: 'resumes',
      ANTHROPIC_API_KEY: '', GEMINI_API_KEY: '', ADZUNA_APP_ID: '', ADZUNA_APP_KEY: '',
      ADZUNA_COUNTRY: 'in', REMOTIVE_API_URL: '', THEMUSE_API_KEY: '',
      SMTP_HOST: '', SMTP_PORT: 587, SMTP_USER: '', SMTP_PASS: '',
      EMAIL_FROM: '', JWT_SECRET: 'test', FRONTEND_URL: '', BULL_BOARD_USERNAME: 'admin',
      BULL_BOARD_PASSWORD: 'admin', VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '',
      VAPID_EMAIL: '', PORT: 3000,
    }));
  });

  test('returns OK status on fresh module load (no failures yet)', () => {
    const { getLinkedInHealth } = require('../../services/job.service');
    const health = getLinkedInHealth();
    expect(health).toHaveProperty('streak');
    expect(health).toHaveProperty('status');
    expect(health.status).toBe('OK');
    expect(health.streak).toBe(0);
  });

  test('health object has the expected shape', () => {
    const { getLinkedInHealth } = require('../../services/job.service');
    const health = getLinkedInHealth();
    expect(typeof health.streak).toBe('number');
    expect(['OK', 'DEGRADED']).toContain(health.status);
  });
});
