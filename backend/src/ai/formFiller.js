// src/ai/formFiller.js
const { callGemini } = require('../config/gemini');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a job application form assistant. Given form field labels and a candidate's profile, map each field to the best answer. Return ONLY valid JSON. Never make up information not present in the profile.`;

/**
 * Use Gemini to fill application form fields from resume data
 * @param {Array<string>} fieldLabels - Array of form field labels from DOM
 * @param {Object} resumeData - Parsed resume data
 * @param {Object} jobData - Job details for context
 * @returns {Object} Map of field label → answer
 */
async function fillFormFields(fieldLabels, resumeData, jobData = {}) {
  if (!fieldLabels || fieldLabels.length === 0) return {};

  const prompt = `Map each application form field label to the best answer from this candidate's profile.

FORM FIELDS TO FILL:
${fieldLabels.map((f, i) => `${i + 1}. "${f}"`).join('\n')}

CANDIDATE PROFILE:
Name: ${resumeData.name}
Email: ${resumeData.email}
Phone: ${resumeData.phone}
Current Location: ${resumeData.current_location || resumeData.location || 'Not specified'}
Current Role: ${resumeData.current_role}
LinkedIn: ${resumeData.linkedin_url || resumeData.linkedin || ''}
GitHub: ${resumeData.github_url || resumeData.github || ''}
Portfolio: ${resumeData.portfolio_url || resumeData.portfolio || ''}
Total Experience: ${resumeData.total_experience_years} years
Skills: ${resumeData.skills?.join(', ')}
Education: ${resumeData.education?.[0]?.degree} from ${resumeData.education?.[0]?.college} (${resumeData.education?.[0]?.year})
Most Recent Job: ${resumeData.experience?.[0]?.role} at ${resumeData.experience?.[0]?.company}
Summary: ${resumeData.summary}

JOB CONTEXT:
Title: ${jobData.title || 'Not specified'}
Company: ${jobData.company || 'Not specified'}

Return ONLY this JSON (field label → answer):
{
  "field_label_1": "answer",
  "field_label_2": "answer",
  ...
}

Rules:
- For "years of experience" fields: use ${resumeData.total_experience_years}
- For salary/CTC fields: answer "As per company standards" or leave blank
- For "notice period": answer "Immediate / 30 days"
- For "current location" or "city" fields: use ${resumeData.current_location || resumeData.location || 'Bangalore'}
- For "willing to relocate": answer "Yes"
- For "linkedin" fields: use ${resumeData.linkedin_url || resumeData.linkedin || ''}
- For "github" fields: use ${resumeData.github_url || resumeData.github || ''}
- For "portfolio" or "website" fields: use ${resumeData.portfolio_url || resumeData.portfolio || ''}
- For unknown fields: return ""`;

  const env = require('../config/env');
  if (!env.GEMINI_API_KEY) {
    logger.warn(`⚠️ No Gemini API key — using mock answers for form fields`);
    const mockAnswers = {};
    for (const label of fieldLabels) {
      const lower = label.toLowerCase();
      if (lower.includes('name') || lower.includes('first') || lower.includes('last')) mockAnswers[label] = resumeData.name || 'Alex Kumar';
      else if (lower.includes('email')) mockAnswers[label] = resumeData.email || 'demo@applyai.dev';
      else if (lower.includes('phone') || lower.includes('mobile')) mockAnswers[label] = resumeData.phone || '+91 9999999999';
      else if (lower.includes('experience') || lower.includes('year')) mockAnswers[label] = String(resumeData.total_experience_years || 3);
      else if (lower.includes('notice')) mockAnswers[label] = 'Immediate';
      else if (lower.includes('salary') || lower.includes('ctc')) mockAnswers[label] = 'As per company standards';
      else if (lower.includes('relocate')) mockAnswers[label] = 'Yes';
      else mockAnswers[label] = '';
    }
    return mockAnswers;
  }

  logger.debug(`Filling ${fieldLabels.length} form fields with Gemini`);
  const result = await callGemini(prompt, SYSTEM_PROMPT, true);
  logger.debug('Form fields filled successfully');

  return result;
}

module.exports = { fillFormFields };
