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
async function callGemini(prompt, systemPrompt = '', expectJson = false) {
  if (!env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    throw ApiError.internal('GEMINI_API_KEY is not configured');
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

  // Wrap in ApiError
  const statusCode = lastError.statusCode || 500;
  throw new ApiError(statusCode, `Gemini API call failed: ${lastError.message || 'Unknown error'}`);
}

module.exports = {
  ai,
  MODEL,
  callGemini
};
