// src/config/env.js
const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Supabase
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_KEY: z.string().optional().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().default('resumes'),

  // Claude AI
  ANTHROPIC_API_KEY: z.string().optional().default(''),

  // Job APIs
  ADZUNA_APP_ID: z.string().optional().default(''),
  ADZUNA_APP_KEY: z.string().optional().default(''),
  ADZUNA_COUNTRY: z.string().default('in'),
  REMOTIVE_API_URL: z.string().default('https://remotive.com/api/remote-jobs'),
  THEMUSE_API_KEY: z.string().optional().default(''),

  // Email
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('ApplyAI <noreply@applyai.dev>'),

  // JWT
  JWT_SECRET: z.string().default('dev-jwt-secret-change-in-production'),

  // App
  FRONTEND_URL: z.string().default('http://localhost:3001'),

  // Bull Board
  BULL_BOARD_USERNAME: z.string().default('admin'),
  BULL_BOARD_PASSWORD: z.string().default('admin123'),
});

let env;
try {
  env = envSchema.parse(process.env);
} catch (err) {
  console.error('❌ Invalid environment variables:', err.errors);
  process.exit(1);
}

module.exports = env;
