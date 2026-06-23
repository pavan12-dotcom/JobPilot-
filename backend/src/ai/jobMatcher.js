// src/ai/jobMatcher.js
const { callGemini } = require('../config/gemini');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a strict Applicant Tracking System (ATS) scan analyzer. Evaluate candidates' resumes against job requirements honestly and return ONLY valid JSON. Never inflate scores — be accurate and provide genuinely helpful optimization tips.`;

/**
 * Generate a deterministic mock ATS score when the Gemini API is unavailable.
 * The score is deterministic (not random) so repeated calls for the same job
 * produce consistent results. Tips and missing skills are tailored by job title.
 *
 * @param {Object} resumeData - Parsed resume data
 * @param {Object} job - Job object
 * @returns {Object} Mock match result
 */
function generateMockScore(resumeData, job) {
  const score = 65 + (job.title.length + job.company.length) % 31;
  const lower = (job.title || '').toLowerCase();

  const isData = lower.includes('data') || lower.includes('analyst') ||
    lower.includes('analytics') || lower.includes('science') ||
    lower.includes('scientist') || lower.includes('intelligence') || lower.includes('ai');
  const isSoftware = lower.includes('engineer') || lower.includes('developer') ||
    lower.includes('software') || lower.includes('backend') ||
    lower.includes('frontend') || lower.includes('full stack') ||
    lower.includes('reliability') || lower.includes('devops') ||
    lower.includes('builder') || lower.includes('tech') ||
    lower.includes('programmer') || lower.includes('sde') || lower.includes('coder');

  let tips, skillsMissing;

  if (isData) {
    tips = [
      `Add specific metrics to your previous roles (e.g. 'Optimized SQL queries reducing dashboard latency by 30%')`,
      `Highlight experience with Big Data/Cloud pipelines (like AWS Redshift, Snowflake, or BigQuery) if applicable`,
      `Explicitly mention ETL and data cleaning techniques in your skills summary section`,
    ];
    skillsMissing = ['Redshift', 'ETL', 'PowerBI'];
  } else if (isSoftware) {
    tips = [
      `Highlight core backend/frontend frameworks (e.g. React, Node.js, Express, Go) and system design patterns.`,
      `Quantify impact on performance (e.g. 'Reduced API response times by 30% through caching and query optimization').`,
      `Emphasize database management, CI/CD pipeline integration, and cloud infrastructure experience.`,
    ];
    skillsMissing = ['Docker', 'CI/CD', 'Kubernetes'];
  } else {
    tips = [
      `Tailor your professional summary to focus on cross-functional product delivery`,
      `Add modern design system tools (like Figma components or Design Tokens) to your core skills`,
      `Include metrics demonstrating project scale and user engagement improvements`,
    ];
    skillsMissing = ['Motion Design', 'SwiftUI', 'Figma'];
  }

  return {
    match_score: score,
    skills_matched: (resumeData.skills || []).slice(0, 4),
    skills_missing: skillsMissing,
    experience_fit: score > 80 ? 'good' : 'partial',
    role_alignment: score > 80 ? 'strong' : 'moderate',
    summary: `Generated mock ATS match score of ${score}% (Gemini API unavailable).`,
    ats_breakdown: {
      keyword_match: Math.round(score * 0.95),
      skills_alignment: Math.round(score * 0.9),
      formatting_score: 85,
      experience_score: Math.round(score * 0.88),
      resume_optimization_tips: tips,
    },
  };
}

/**
 * Score a job against a candidate's resume using Gemini AI
 * @param {Object} resumeData - Parsed resume data
 * @param {Object} job - Job object with title, description, requirements
 * @returns {Object} Match result with score and reasons
 */
async function scoreJobMatch(resumeData, job) {
  const prompt = `Perform an ATS scan analysis between this candidate's resume and the job description. Return ONLY valid JSON.

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

Return ONLY this JSON structure (no markdown boxes, no other text):
{
  "match_score": <0-100 overall ATS score integer, above 70 only for strong matches>,
  "skills_matched": ["list of matching skills"],
  "skills_missing": ["required skills missing in candidate resume"],
  "experience_fit": "good" | "partial" | "poor",
  "role_alignment": "strong" | "moderate" | "weak",
  "summary": "2-sentence assessment explanation",
  "ats_breakdown": {
    "keyword_match": <0-100 keyword intersection score>,
    "skills_alignment": <0-100 skill compatibility score>,
    "formatting_score": <0-100 resume formatting and parser-friendly score>,
    "experience_score": <0-100 experience matching score>,
    "resume_optimization_tips": [
      "specific, actionable suggestion 1 to improve resume for this job",
      "specific, actionable suggestion 2 to improve resume for this job",
      "specific, actionable suggestion 3 to improve resume for this job"
    ]
  }
}`;

  const env = require('../config/env');
  if (!env.GEMINI_API_KEY) {
    logger.warn(`⚠️ No Gemini API key — using mock score for ${job.title}`);
    return generateMockScore(resumeData, job);
  }

  try {
    const result = await callGemini(prompt, SYSTEM_PROMPT, true);
    logger.debug(`Job match scored: ${job.title} at ${job.company} → ${result.match_score}/100`);
    return result;
  } catch (err) {
    logger.error(`❌ Gemini scoring failed for "${job.title}": ${err.message}. Falling back to mock scoring.`);
    return generateMockScore(resumeData, job);
  }
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
