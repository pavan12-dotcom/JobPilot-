// src/ai/coverLetter.js
const { callGemini } = require('../config/gemini');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are an expert cover letter writer. Write concise, human-sounding cover letters that are specific to the candidate and job. Never use clichés or generic opening lines.`;

/**
 * Generate a personalized cover letter using Gemini AI
 * @param {Object} resumeData - Parsed resume data
 * @param {Object} job - Job details
 * @param {Object} matchReasons - Match analysis from jobMatcher
 * @returns {string} Generated cover letter text
 */
async function generateCoverLetter(resumeData, job, matchReasons = null) {
  const skillsContext = matchReasons?.skills_matched?.length
    ? `Highlighted strengths for this role: ${matchReasons.skills_matched.join(', ')}`
    : `Key skills: ${resumeData.skills?.slice(0, 6).join(', ')}`;

  const prompt = `Write a professional cover letter (max 200 words) for this candidate applying to this specific job.

CANDIDATE:
Name: ${resumeData.name}
Current Role: ${resumeData.current_role}
Experience: ${resumeData.total_experience_years} years
${skillsContext}
Most recent experience: ${resumeData.experience?.[0]?.role} at ${resumeData.experience?.[0]?.company}
Summary: ${resumeData.summary}
${resumeData.cover_letter ? `Candidate Cover Letter Guidelines/Instructions: ${resumeData.cover_letter}` : ''}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
${job.description?.substring(0, 600)}

RULES:
- Do NOT start with "I am writing to express" or "I am excited to apply"
- Open with a specific, confident statement about their fit
- Reference 1-2 specific achievements from their experience
- Mention something specific about the company (from context)
- End with a clear call to action
- Sound human, confident, and specific — not generic
- Keep it under 200 words
${resumeData.cover_letter ? `- Adhere to the Candidate Cover Letter Guidelines/Instructions provided above` : ''}

Write the cover letter:`;

  const env = require('../config/env');
  if (!env.GEMINI_API_KEY) {
    logger.warn(`⚠️ No Gemini API key — using mock cover letter for ${job.title}`);
    return `Dear Hiring Manager at ${job.company},

I am writing to express my interest in the ${job.title} role. With over ${resumeData.total_experience_years || 3} years of professional experience, including my recent role as ${resumeData.current_role || 'Developer'}, I am confident that my skills in ${resumeData.skills?.slice(0, 3).join(', ') || 'software development'} align well with your team's goals.

I look forward to discussing how my experience can contribute to ${job.company}.

Sincerely,
${resumeData.name || 'Alex Kumar'}`;
  }

  logger.debug(`Generating cover letter for ${job.title} at ${job.company}`);
  const letter = await callGemini(prompt, SYSTEM_PROMPT, false);
  logger.debug(`Cover letter generated: ${letter.split(' ').length} words`);

  return letter.trim();
}

module.exports = { generateCoverLetter };
