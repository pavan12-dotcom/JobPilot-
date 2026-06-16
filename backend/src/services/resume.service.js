// src/services/resume.service.js
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../db/prisma');
const { parseResume } = require('../ai/resumeParser');
const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

function getSupabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
}

/**
 * Upload resume PDF to Supabase Storage
 */
async function uploadToStorage(file, userId) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // In demo mode, return a placeholder URL
    return `https://demo.applyai.dev/resumes/${userId}/${file.originalname}`;
  }

  const fileName = `${userId}/${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;

  const { data, error } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Extract text from a PDF buffer
 */
async function extractPdfText(buffer) {
  try {
    const data = await pdf(buffer);
    if (!data.text || data.text.trim().length < 100) {
      throw new Error('PDF appears to be empty or image-based');
    }
    return data.text.trim();
  } catch (err) {
    throw ApiError.badRequest(`Failed to extract text from PDF: ${err.message}`);
  }
}

/**
 * Upload, extract, parse, and save a resume
 */
async function uploadAndParseResume(file, userId, label = null) {
  // 1. Extract text from PDF
  logger.info(`📄 Extracting text from ${file.originalname}...`);
  const rawText = await extractPdfText(file.buffer);
  logger.info(`✅ Extracted ${rawText.length} characters`);

  // 2. Upload to storage
  const fileUrl = await uploadToStorage(file, userId);

  // 3. Deactivate existing resumes
  await prisma.resume.updateMany({
    where: { user_id: userId, is_active: true },
    data: { is_active: false },
  });

  // 4. Parse with Claude (or use mock in demo mode)
  let parsedData;
  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('⚠️ No Claude API key — using mock parsed data');
    parsedData = {
      name: 'Demo User',
      email: 'demo@example.com',
      phone: '+91 9999999999',
      skills: ['JavaScript', 'Node.js', 'React', 'SQL'],
      experience: [],
      education: [],
      total_experience_years: 2,
      current_role: 'Software Developer',
      preferred_roles: ['Software Engineer', 'Developer'],
      summary: 'Software developer with experience in web technologies.',
    };
  } else {
    parsedData = await parseResume(rawText);
  }

  // 5. Save to DB
  const resume = await prisma.resume.create({
    data: {
      user_id: userId,
      file_url: fileUrl,
      file_name: file.originalname,
      label: label || file.originalname.replace(/\.pdf$/i, ''),
      raw_text: rawText,
      parsed_data: parsedData,
      is_active: true,
    },
  });

  return { resume, parsedData };
}

/**
 * Re-run Claude parser on an existing resume
 */
async function reparseResume(resumeId, userId) {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, user_id: userId },
  });

  if (!resume) throw ApiError.notFound('Resume not found');
  if (!resume.raw_text) throw ApiError.badRequest('No raw text available for reparsing');

  const parsedData = await parseResume(resume.raw_text);

  const updated = await prisma.resume.update({
    where: { id: resumeId },
    data: { parsed_data: parsedData },
  });

  return updated;
}

/**
 * Get active resume for a user
 */
async function getActiveResume(userId) {
  return prisma.resume.findFirst({
    where: { user_id: userId, is_active: true },
    orderBy: { created_at: 'desc' },
  });
}

/**
 * Set a specific resume as active and deactivate all others
 */
async function setActiveResume(resumeId, userId) {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, user_id: userId },
  });
  if (!resume) throw ApiError.notFound('Resume not found');

  await prisma.resume.updateMany({
    where: { user_id: userId },
    data: { is_active: false },
  });

  const updated = await prisma.resume.update({
    where: { id: resumeId },
    data: { is_active: true },
  });

  return updated;
}

module.exports = { uploadAndParseResume, reparseResume, getActiveResume, setActiveResume };
