// src/ai/jobMatcher.js
const { callGemini } = require('../config/gemini');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a strict Applicant Tracking System (ATS) scan analyzer. Evaluate candidates' resumes against job requirements honestly and return ONLY valid JSON. Never inflate scores — be accurate and provide genuinely helpful optimization tips.`;

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
    const score = 65 + (job.title.length + job.company.length) % 31;
    
    // Generate realistic tips based on job title
    const isData = job.title.toLowerCase().includes('data') || job.title.toLowerCase().includes('analyst');
    const tips = isData 
      ? [
          `Add specific metrics to your previous roles (e.g. 'Optimized SQL queries reducing dashboard latency by 30%')`,
          `Highlight experience with Big Data/Cloud pipelines (like AWS Redshift, Snowflake, or BigQuery) if applicable`,
          `Explicitly mention ETL and data cleaning techniques in your skills summary section`
        ]
      : [
          `Tailor your professional summary to focus on cross-functional product delivery`,
          `Add modern design design system tools (like Figma components or Design Tokens) to your core skills`,
          `Include metrics demonstrating project scale and user engagement improvements`
        ];

    return {
      match_score: score,
      skills_matched: (resumeData.skills || []).slice(0, 4),
      skills_missing: isData ? ['Redshift', 'ETL', 'PowerBI'] : ['Motion Design', 'SwiftUI'],
      experience_fit: score > 80 ? 'good' : 'partial',
      role_alignment: score > 80 ? 'strong' : 'moderate',
      summary: `Generated mock ATS match score of ${score}% for demonstration purposes.`,
      ats_breakdown: {
        keyword_match: Math.round(score * 0.95),
        skills_alignment: Math.round(score * 0.9),
        formatting_score: 85,
        experience_score: Math.round(score * 0.88),
        resume_optimization_tips: tips
      }
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
