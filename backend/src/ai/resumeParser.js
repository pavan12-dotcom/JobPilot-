// src/ai/resumeParser.js
const { callClaude } = require('../config/claude');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are an expert resume parser. Extract structured data from resume text and return ONLY valid JSON. Do not include any explanation or markdown formatting outside the JSON.`;

/**
 * Parse raw resume text using Claude AI
 * @param {string} rawText - Extracted text from PDF
 * @returns {Object} Structured resume data
 */
async function parseResume(rawText) {
  const prompt = `Extract structured data from this resume and return ONLY valid JSON with exactly these fields:

{
  "name": "string - full name",
  "email": "string - email address or null",
  "phone": "string - phone number or null",
  "skills": ["array of technical and soft skills"],
  "experience": [
    {
      "company": "company name",
      "role": "job title",
      "years": 1.5,
      "description": "brief description of responsibilities"
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "college": "institution name",
      "year": 2021
    }
  ],
  "total_experience_years": 3,
  "current_role": "most recent job title",
  "preferred_roles": ["array of 3-5 job titles this person is suited for"],
  "summary": "2-sentence professional summary highlighting key strengths"
}

Resume text:
${rawText}`;

  logger.info('🤖 Parsing resume with Claude...');
  const result = await callClaude(prompt, SYSTEM_PROMPT, true);
  logger.info(`✅ Resume parsed: ${result.name}, ${result.skills?.length} skills found`);

  return result;
}

module.exports = { parseResume };
