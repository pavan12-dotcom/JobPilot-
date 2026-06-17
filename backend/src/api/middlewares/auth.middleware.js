// src/api/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../../db/prisma');
const ApiError = require('../../utils/ApiError');
const env = require('../../config/env');
const logger = require('../../utils/logger');

let supabaseAdmin = null;

function getSupabase() {
  if (!supabaseAdmin && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  }
  return supabaseAdmin;
}

/**
 * Middleware: authenticate via JWT (local) or Supabase JWT
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing authorization token');
    }

    const token = authHeader.split(' ')[1];
    let userId = null;

    // Try Supabase JWT first (if configured)
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          // Find or create user in our DB
          let user = await prisma.user.findUnique({
            where: { supabase_id: data.user.id },
          });

          if (!user) {
            // Check if user with same email already exists
            user = await prisma.user.findUnique({
              where: { email: data.user.email },
            });

            if (user) {
              // Link Supabase ID to existing user record
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  supabase_id: data.user.id,
                  avatar_url: user.avatar_url || data.user.user_metadata?.avatar_url,
                },
              });
              logger.info(`🔗 Linked Supabase ID to existing user: ${user.email}`);
            } else {
              // Auto-create user from Supabase data
              user = await prisma.user.create({
                data: {
                  email: data.user.email,
                  name: data.user.user_metadata?.name || data.user.email.split('@')[0],
                  supabase_id: data.user.id,
                  avatar_url: data.user.user_metadata?.avatar_url,
                },
              });
              logger.info(`✅ Auto-created user: ${user.email}`);
            }
          }

          req.user = user;
          return next();
        }
      } catch (supabaseErr) {
        logger.debug('Supabase auth failed, trying local JWT:', supabaseErr.message);
      }
    }

    // Fall back to local JWT (demo mode)
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      userId = decoded.userId || decoded.sub;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw ApiError.unauthorized('User not found');

      req.user = user;
      return next();
    } catch (jwtErr) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Generate a local JWT token (for demo/dev mode)
 */
function generateToken(userId) {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticate, generateToken };
