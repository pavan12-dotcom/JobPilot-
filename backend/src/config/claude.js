// src/config/claude.js
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const env = require('./env');
const logger = require('../utils/logger');

let claudeClient = null;

function getClaudeClient() {
  if (!claudeClient) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    claudeClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return claudeClient;
}

const CLAUDE_MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 4096;

/**
 * Helper to call Gemini with a prompt and parse JSON response
 */
async function callGemini(prompt, systemPrompt = '', expectJson = false) {
  const apiKey = env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  logger.debug('🤖 Calling Gemini API (gemini-1.5-flash)...');

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {}
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  if (expectJson) {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (expectJson) {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```(?:json)?\n?/g, '').trim();
      return JSON.parse(cleaned);
    }

    return content;
  } catch (err) {
    const responseData = err.response?.data;
    logger.error('Gemini API call failed:', responseData ? JSON.stringify(responseData) : err.message);
    throw new Error(`Gemini API call failed: ${err.message}`);
  }
}

/**
 * Helper to call Claude with a prompt and parse JSON response
 * Routes to Gemini automatically if GEMINI_API_KEY is configured
 */
async function callClaude(prompt, systemPrompt = '', expectJson = false) {
  if (env.GEMINI_API_KEY) {
    return callGemini(prompt, systemPrompt, expectJson);
  }

  const client = getClaudeClient();
  const messages = [{ role: 'user', content: prompt }];

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt || 'You are a helpful AI assistant for job application automation.',
    messages,
  });

  const content = response.content[0]?.text || '';

  if (expectJson) {
    // Strip markdown code blocks if present
    const cleaned = content.replace(/```(?:json)?\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from the response
      const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error(`Claude returned invalid JSON: ${content.substring(0, 200)}`);
    }
  }

  return content;
}

module.exports = { getClaudeClient, callClaude, CLAUDE_MODEL };
