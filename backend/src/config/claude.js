// src/config/claude.js
const Anthropic = require('@anthropic-ai/sdk');
const env = require('./env');

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
 * Helper to call Claude with a prompt and parse JSON response
 */
async function callClaude(prompt, systemPrompt = '', expectJson = false) {
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
