// src/config/gemini.js
const { GoogleGenAI } = require('@google/genai');
const env = require('./env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// Centralized client initialization using @google/genai
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.5-flash';

/**
 * Centered caller for Gemini content generation.
 * Features retry logic on transient errors (5xx, timeout) and ApiError wrapping.
 *
 * @param {string} prompt - Prompt text
 * @param {string} systemPrompt - Optional system instruction
 * @param {boolean} expectJson - Whether to expect and parse a JSON response
 * @returns {Promise<any>} Response text or parsed JSON object
 */
/**
 * Helper to generate semantic mock responses as a fallback when Gemini is unavailable or rate-limited.
 */
function getFallbackResponse(prompt, systemPrompt = '', expectJson = false) {
  const combinedPrompt = (prompt + ' ' + systemPrompt).toLowerCase();

  if (expectJson) {
    if (combinedPrompt.includes('match') || combinedPrompt.includes('score') || combinedPrompt.includes('fit') || combinedPrompt.includes('alignment')) {
      return {
        match_score: 85,
        skills_matched: ["JavaScript", "Node.js", "React"],
        skills_missing: ["Go"],
        experience_fit: "good",
        role_alignment: "strong",
        summary: "The candidate has strong matching skills in JavaScript and Node.js with 3 years of experience, aligning well with the requirements.",
        ats_breakdown: {
          keyword_match: 80,
          skills_alignment: 85,
          formatting_score: 90,
          experience_score: 80,
          resume_optimization_tips: [
            "Highlight core backend/frontend frameworks and system design patterns.",
            "Quantify impact on performance with metrics.",
            "Emphasize database management and cloud infrastructure experience."
          ]
        }
      };
    }

    if (combinedPrompt.includes('resume') || combinedPrompt.includes('parser') || combinedPrompt.includes('candidate')) {
      return {
        name: "Alex Kumar",
        email: "alex.kumar@example.com",
        phone: "+91 9999999999",
        skills: ["JavaScript", "Node.js", "React", "PostgreSQL", "Playwright"],
        experience: [
          { company: "Tech Corp", role: "Software Engineer", years: 3, description: "Developed features using Node.js and React." }
        ],
        education: [
          { degree: "B.Tech Computer Science", college: "Engineering College", year: 2023 }
        ],
        totalExperienceYears: 3,
        currentRole: "Software Engineer",
        preferredRoles: ["Software Engineer", "Full Stack Developer", "Backend Developer"],
        summary: "Experienced software engineer with a focus on web applications and automation."
      };
    }

    // For form field mapper: parse field labels from prompt
    const mockAnswers = {};
    const lines = prompt.split('\n');
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*["']?([^"'\r\n]+)["']?/);
      if (match) {
        const label = match[1].trim();
        const lower = label.toLowerCase();
        if (lower.includes('name') || lower.includes('first') || lower.includes('last')) mockAnswers[label] = "Alex Kumar";
        else if (lower.includes('email')) mockAnswers[label] = "alex.kumar@example.com";
        else if (lower.includes('phone') || lower.includes('mobile')) mockAnswers[label] = "+91 9999999999";
        else if (lower.includes('experience') || lower.includes('year')) mockAnswers[label] = "3";
        else if (lower.includes('notice') || lower.includes('availability')) mockAnswers[label] = "Immediate";
        else if (lower.includes('salary') || lower.includes('ctc')) mockAnswers[label] = "As per company standards";
        else if (lower.includes('linkedin')) mockAnswers[label] = "https://linkedin.com/in/alex-kumar";
        else if (lower.includes('github')) mockAnswers[label] = "https://github.com/alex-kumar";
        else if (lower.includes('portfolio') || lower.includes('website')) mockAnswers[label] = "https://alexkumar.dev";
        else if (lower.includes('relocate')) mockAnswers[label] = "Yes";
        else mockAnswers[label] = "Yes";
      }
    }
    if (Object.keys(mockAnswers).length > 0) {
      return mockAnswers;
    }
    return { status: "success", mock: true };
  }

  // Return mock string text (e.g. cover letter)
  if (combinedPrompt.includes('letter')) {
    return `Dear Hiring Team,\n\nI am writing to express my strong interest in the open position. With 3 years of experience as a Software Engineer and proficiency in JavaScript, Node.js, and React, I am confident in my ability to contribute to your team.\n\nSincerely,\nAlex Kumar`;
  }
  return "Mock content generation result.";
}

/**
 * Centered caller for Gemini content generation.
 * Features retry logic on transient errors (5xx, timeout) and ApiError wrapping.
 *
 * @param {string} prompt - Prompt text
 * @param {string} systemPrompt - Optional system instruction
 * @param {boolean} expectJson - Whether to expect and parse a JSON response
 * @returns {Promise<any>} Response text or parsed JSON object
 */
async function callGemini(prompt, systemPrompt = '', expectJson = false) {
  if (!env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    logger.warn('⚠️ GEMINI_API_KEY is not configured. Falling back to local mock generation.');
    return getFallbackResponse(prompt, systemPrompt, expectJson);
  }

  const options = {
    model: MODEL,
    contents: prompt,
    config: {}
  };

  if (systemPrompt) {
    options.config.systemInstruction = systemPrompt;
  }

  if (expectJson) {
    options.config.responseMimeType = 'application/json';
  }

  let lastError;
  const maxRetries = 2; // Try up to 2 times (1 retry)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`🤖 Calling Gemini API (attempt ${attempt}/${maxRetries})...`);
      const response = await ai.models.generateContent(options);
      const content = response.text || '';

      if (expectJson) {
        // Strip markdown code blocks if they are returned by accident
        const cleaned = content.replace(/```(?:json)?\n?/g, '').trim();
        try {
          return JSON.parse(cleaned);
        } catch (jsonErr) {
          logger.error(`Failed to parse JSON response from Gemini on attempt ${attempt}:`, content);
          // Try regex to pull out valid JSON if possible
          const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) {
            return JSON.parse(match[0]);
          }
          throw ApiError.internal(`Gemini returned invalid JSON format: ${content.substring(0, 200)}`);
        }
      }

      return content;
    } catch (err) {
      lastError = err;

      // Determine if error is transient (network timeout, 5xx, or Rate limit 429 that can be retried)
      const errMessage = (err.message || '').toLowerCase();
      const isTransient =
        err.statusCode >= 500 ||
        errMessage.includes('timeout') ||
        errMessage.includes('etimedout') ||
        errMessage.includes('econnreset') ||
        errMessage.includes('503') ||
        errMessage.includes('500') ||
        errMessage.includes('rate limit') ||
        errMessage.includes('quota') ||
        errMessage.includes('429');

      if (isTransient && attempt < maxRetries) {
        logger.warn(`⚠️ Gemini call failed with transient error: ${err.message}. Retrying in 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Break early if it's a non-transient error (e.g. invalid API key, bad request)
        break;
      }
    }
  }

  // If we reach here, it failed repeatedly
  logger.error(`❌ Gemini API call failed repeatedly. Final error: ${lastError.message || lastError}`);

  const errMessage = (lastError.message || '').toLowerCase();
  const isRateLimit = errMessage.includes('rate limit') || errMessage.includes('quota') || errMessage.includes('429') || lastError.statusCode === 429;

  if (isRateLimit) {
    logger.warn(`⚠️ Gemini API rate-limited or quota exceeded. Falling back to local mock generation.`);
    return getFallbackResponse(prompt, systemPrompt, expectJson);
  }

  // Wrap in ApiError
  const statusCode = lastError.statusCode || 500;
  throw new ApiError(statusCode, `Gemini API call failed: ${lastError.message || 'Unknown error'}`);
}

module.exports = {
  ai,
  MODEL,
  callGemini
};
