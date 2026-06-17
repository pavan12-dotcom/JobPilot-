// src/ai/jobMatcher.js
const { callGemini } = require('../config/gemini');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a strict job match analyzer for a recruitment platform. Evaluate candidates honestly and return ONLY valid JSON. Never inflate scores — be genuinely helpful to job seekers by being accurate.`;

/**
 * Score a job against a candidate's resume using Gemini AI
 * @param {Object} resumeData - Parsed resume data
 * @param {Object} job - Job object with title, description, requirements
 * @returns {Object} Match result with score and reasons
 */
async function scoreJobMatch(resumeData, job) {
  const prompt = `Analyze the match between this candidate and job. Return ONLY valid JSON.

CANDIDATE PROFILE:
Name: ${resumeData.name}
Current Role: ${resumeData.current_role}
Total Experience: ${resumeData.total_experience_years} years
Skills: ${resumeData.skills?.join(', ')}
Experience: ${resumeData.experience?.map((e) => `${e.role} at ${e.company} (${e.years} years)`).join(', ')}
Summary: ${resumeData.summary}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description?.substring(0, 1000)}
Requirements: ${job.requirements?.substring(0, 500)}

Return ONLY this JSON (no other text):
{
  "match_score": <0-100 integer, be strict: above 70 only for genuinely strong matches>,
  "skills_matched": ["skills the candidate has that are relevant"],
  "skills_missing": ["required skills the candidate lacks"],
  "experience_fit": "good" | "partial" | "poor",
  "role_alignment": "strong" | "moderate" | "weak",
  "summary": "2-sentence explanation of why this is or isn't a good match"
}`;

  const env = require('../config/env');
  if (!env.GEMINI_API_KEY) {
    logger.warn(`⚠️ No Gemini API key — using mock score for ${job.title}`);
    const score = 65 + (job.title.length + job.company.length) % 31;
    return {
      match_score: score,
      skills_matched: (resumeData.skills || []).slice(0, 3),
      skills_missing: ['Docker', 'AWS'].filter(s => !(resumeData.skills || []).includes(s)),
      experience_fit: score > 80 ? 'good' : 'partial',
      role_alignment: score > 80 ? 'strong' : 'moderate',
      summary: `Generated mock match score of ${score}% for demonstration purposes.`
    };
  }

  const result = await callGemini(prompt, SYSTEM_PROMPT, true);
  logger.debug(`Job match scored: ${job.title} at ${job.company} → ${result.match_score}/100`);

  return result;
}

/**
 * Batch score multiple jobs against a resume
 * @param {Object} resumeData - Parsed resume
 * @param {Array} jobs - Array of job objects
 * @param {Function} onProgress - Callback(completed, total)
 * @returns {Array} Array of { job, matchResult }
 */
async function batchScoreJobs(resumeData, jobs, onProgress = null) {
  const results = [];
  const BATCH_DELAY_MS = 600; // Respect rate limits (~100/min)

  for (let i = 0; i < jobs.length; i++) {
    try {
      const matchResult = await scoreJobMatch(resumeData, jobs[i]);
      results.push({ job: jobs[i], matchResult });

      if (onProgress) onProgress(i + 1, jobs.length);

      // Rate limit: wait between calls
      if (i < jobs.length - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    } catch (err) {
      logger.error(`Failed to score job ${jobs[i].id}:`, err.message);
      results.push({ job: jobs[i], matchResult: null, error: err.message });
    }
  }

  return results;
}

module.exports = { scoreJobMatch, batchScoreJobs };
