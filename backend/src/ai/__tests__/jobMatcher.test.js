/**
 * Tests for the generateMockScore helper (extracted in Fix #3).
 * These run without any external API calls or DB connections.
 */

// We need to extract the function for testing.
// Since it's not exported, we test the module's public scoreJobMatch in mock mode
// by temporarily clearing GEMINI_API_KEY from process.env.

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

function makeMockResume(skills = []) {
  return {
    name: 'Test User',
    skills,
    total_experience_years: 3,
    current_role: 'Software Engineer',
  };
}

function makeMockJob(title, company = 'Acme Corp') {
  return {
    id: 'job-123',
    title,
    company,
    description: `${title} position at ${company}`,
    requirements: 'Some requirements',
    source: 'INDEED',
  };
}

describe('scoreJobMatch — mock fallback (no API key)', () => {
  beforeEach(() => {
    // Force mock path by clearing the API key
    process.env.GEMINI_API_KEY = '';
  });

  test('returns a numeric score between 0 and 100', async () => {
    const { scoreJobMatch } = require('../../ai/jobMatcher');
    const resume = makeMockResume(['JavaScript', 'React', 'Node.js']);
    const job = makeMockJob('Frontend Developer');
    const result = await scoreJobMatch(resume, job);

    expect(typeof result.match_score).toBe('number');
    expect(result.match_score).toBeGreaterThanOrEqual(0);
    expect(result.match_score).toBeLessThanOrEqual(100);
  });

  test('result has all required top-level fields', async () => {
    const { scoreJobMatch } = require('../../ai/jobMatcher');
    const result = await scoreJobMatch(makeMockResume(), makeMockJob('Data Analyst'));

    expect(result).toHaveProperty('match_score');
    expect(result).toHaveProperty('skills_matched');
    expect(result).toHaveProperty('skills_missing');
    expect(result).toHaveProperty('experience_fit');
    expect(result).toHaveProperty('role_alignment');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('ats_breakdown');
  });

  test('ats_breakdown contains expected keys with numeric values', async () => {
    const { scoreJobMatch } = require('../../ai/jobMatcher');
    const result = await scoreJobMatch(makeMockResume(), makeMockJob('Backend Engineer'));
    const { ats_breakdown } = result;

    expect(typeof ats_breakdown.keyword_match).toBe('number');
    expect(typeof ats_breakdown.skills_alignment).toBe('number');
    expect(typeof ats_breakdown.formatting_score).toBe('number');
    expect(typeof ats_breakdown.experience_score).toBe('number');
    expect(Array.isArray(ats_breakdown.resume_optimization_tips)).toBe(true);
    expect(ats_breakdown.resume_optimization_tips.length).toBeGreaterThan(0);
  });

  test('skills_matched returns only skills from the resume', async () => {
    const { scoreJobMatch } = require('../../ai/jobMatcher');
    const skills = ['Python', 'SQL', 'Pandas', 'Tableau', 'dbt'];
    const result = await scoreJobMatch(makeMockResume(skills), makeMockJob('Data Engineer'));

    // All matched skills must come from the resume
    result.skills_matched.forEach((s) => {
      expect(skills).toContain(s);
    });
  });

  test('score is deterministic for the same job title and company', async () => {
    const { scoreJobMatch } = require('../../ai/jobMatcher');
    const resume = makeMockResume(['React', 'TypeScript']);
    const job = makeMockJob('Senior Frontend Developer', 'Google');

    const r1 = await scoreJobMatch(resume, job);
    const r2 = await scoreJobMatch(resume, job);
    expect(r1.match_score).toBe(r2.match_score);
  });

  test('generates data-themed tips for a data analyst role', async () => {
    const { scoreJobMatch } = require('../../ai/jobMatcher');
    const result = await scoreJobMatch(makeMockResume(), makeMockJob('Data Analyst'));
    const tips = result.ats_breakdown.resume_optimization_tips;
    const tipText = tips.join(' ').toLowerCase();
    // At least one tip should mention data-related keywords
    expect(tipText).toMatch(/sql|etl|bigquery|redshift|data|analytics/i);
  });

  test('generates software-themed tips for a software engineer role', async () => {
    const { scoreJobMatch } = require('../../ai/jobMatcher');
    const result = await scoreJobMatch(makeMockResume(), makeMockJob('Software Engineer'));
    const tips = result.ats_breakdown.resume_optimization_tips;
    const tipText = tips.join(' ').toLowerCase();
    expect(tipText).toMatch(/framework|api|docker|kubernetes|ci\/?cd|backend|frontend/i);
  });
});
