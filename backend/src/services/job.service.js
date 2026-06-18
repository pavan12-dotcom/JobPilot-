// src/services/job.service.js
const axios = require('axios');
const prisma = require('../db/prisma');
const env = require('../config/env');
const logger = require('../utils/logger');

// ── Adzuna API ──────────────────────────────────────────────────────────────

async function fetchFromAdzuna(targetRoles = [], locations = []) {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
    logger.warn('⚠️ Adzuna API credentials not configured');
    return [];
  }

  const jobs = [];
  const searchTerms = targetRoles.slice(0, 3); // Limit searches
  const searchLocations = locations.slice(0, 2);

  for (const role of searchTerms) {
    for (const location of searchLocations) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/${env.ADZUNA_COUNTRY}/search/1`;
        const { data } = await axios.get(url, {
          params: {
            app_id: env.ADZUNA_APP_ID,
            app_key: env.ADZUNA_APP_KEY,
            what: role,
            where: location === 'Remote' ? '' : location,
            results_per_page: 20,
            content_type: 'application/json',
          },
        });

        const results = (data.results || []).map((job) => ({
          external_id: `adzuna_${job.id}`,
          source: 'ADZUNA',
          title: job.title,
          company: job.company?.display_name || 'Unknown Company',
          location: job.location?.display_name || location,
          job_type: location === 'Remote' ? 'REMOTE' : 'FULL_TIME',
          description: job.description || '',
          requirements: '',
          salary_min: job.salary_min ? Math.round(job.salary_min) : null,
          salary_max: job.salary_max ? Math.round(job.salary_max) : null,
          apply_url: job.redirect_url || job.apply_url || '#',
          posted_at: job.created ? new Date(job.created) : new Date(),
        }));

        jobs.push(...results);
        await new Promise((r) => setTimeout(r, 300)); // Rate limit
      } catch (err) {
        logger.error(`Adzuna fetch failed for "${role}" in "${location}":`, err.message);
      }
    }
  }

  return jobs;
}

// ── Remotive API ────────────────────────────────────────────────────────────

async function fetchFromRemotive(targetRoles = []) {
  try {
    const searchTerm = targetRoles[0] || 'software engineer';
    const { data } = await axios.get(env.REMOTIVE_API_URL, {
      params: { search: searchTerm, limit: 30 },
      timeout: 10000,
    });

    return (data.jobs || []).map((job) => ({
      external_id: `remotive_${job.id}`,
      source: 'REMOTIVE',
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      job_type: 'REMOTE',
      description: job.description?.replace(/<[^>]*>/g, '') || '',
      requirements: '',
      salary_min: null,
      salary_max: null,
      apply_url: job.url,
      posted_at: job.publication_date ? new Date(job.publication_date) : new Date(),
    }));
  } catch (err) {
    logger.error('Remotive fetch failed:', err.message);
    return [];
  }
}

// ── The Muse API ────────────────────────────────────────────────────────────

async function fetchFromTheMuse(targetRoles = []) {
  try {
    const category = mapRoleToMuseCategory(targetRoles[0]);
    const params = {
      category,
      page: 1,
      api_key: env.THEMUSE_API_KEY || undefined,
    };

    const { data } = await axios.get('https://www.themuse.com/api/public/jobs', {
      params,
      timeout: 10000,
    });

    return (data.results || []).map((job) => ({
      external_id: `themuse_${job.id}`,
      source: 'THEMUSE',
      title: job.name,
      company: job.company?.name || 'Unknown',
      location: job.locations?.[0]?.name || 'Remote',
      job_type: job.locations?.[0]?.name?.toLowerCase().includes('remote') ? 'REMOTE' : 'FULL_TIME',
      description: job.contents?.replace(/<[^>]*>/g, '') || '',
      requirements: '',
      salary_min: null,
      salary_max: null,
      apply_url: job.refs?.landing_page || '#',
      posted_at: job.publication_date ? new Date(job.publication_date) : new Date(),
    }));
  } catch (err) {
    logger.error('TheMuse fetch failed:', err.message);
    return [];
  }
}

function mapRoleToMuseCategory(role = '') {
  const r = role.toLowerCase();
  if (r.includes('software') || r.includes('engineer') || r.includes('developer')) return 'Software Engineer';
  if (r.includes('data') || r.includes('ml') || r.includes('ai')) return 'Data Science';
  if (r.includes('devops') || r.includes('cloud')) return 'DevOps & Sysadmin';
  if (r.includes('product')) return 'Product';
  if (r.includes('design')) return 'Design & UX';
  return 'Software Engineer';
}

// ── Deduplication & DB Upsert ───────────────────────────────────────────────

async function deduplicateAndSaveJobs(rawJobs) {
  let created = 0;
  let duplicate = 0;

  for (const jobData of rawJobs) {
    try {
      await prisma.job.upsert({
        where: { external_id: jobData.external_id },
        update: { is_active: true }, // Mark as still active
        create: jobData,
      });

      // Check if it was already there (simple heuristic)
      const existingCount = await prisma.job.count({
        where: { external_id: jobData.external_id },
      });

      if (existingCount > 0) duplicate++;
      else created++;
    } catch (err) {
      logger.error(`Failed to save job ${jobData.external_id}:`, err.message);
    }
  }

  return { created, duplicate, total: rawJobs.length };
}

/**
 * Fetch fresh jobs from all APIs for a user's preferences
 */
async function fetchJobsForUser(preferences) {
  const { target_roles = [], target_locations = [] } = preferences;

  logger.info(`🔍 Fetching jobs for roles: ${target_roles.join(', ')}`);

  const [adzunaJobs, remotiveJobs, museJobs] = await Promise.allSettled([
    fetchFromAdzuna(target_roles, target_locations),
    fetchFromRemotive(target_roles),
    fetchFromTheMuse(target_roles),
  ]);

  const allJobs = [
    ...(adzunaJobs.status === 'fulfilled' ? adzunaJobs.value : []),
    ...(remotiveJobs.status === 'fulfilled' ? remotiveJobs.value : []),
    ...(museJobs.status === 'fulfilled' ? museJobs.value : []),
  ];

  logger.info(`📦 Total fetched: ${allJobs.length} jobs`);

  const stats = await deduplicateAndSaveJobs(allJobs);
  logger.info(`✅ Saved: ${stats.created} new, ${stats.duplicate} duplicate`);

  return stats;
}

/**
 * Get recommended jobs for a user (already matched and scored)
 */
async function getRecommendedJobs(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    min_score = 50,
    job_type,
    location,
    source,
    saved_only = false,
  } = options;

  const prefs = await prisma.preference.findUnique({
    where: { user_id: userId },
  });
  const targetRole = prefs?.target_roles?.[0];

  const where = {
    user_id: userId,
    match_score: { gte: Number(min_score) },
    ...(saved_only && { is_saved: true }),
  };

  if (targetRole && targetRole.trim()) {
    const roleTerm = targetRole.trim().toLowerCase();
    if (roleTerm.includes('react')) {
      where.job = {
        OR: [
          { title: { contains: 'react', mode: 'insensitive' } },
          { description: { contains: 'react', mode: 'insensitive' } }
        ]
      };
    } else if (roleTerm.includes('data') || roleTerm.includes('analyst') || roleTerm.includes('analytics')) {
      where.job = {
        OR: [
          { title: { contains: 'data', mode: 'insensitive' } },
          { title: { contains: 'analyst', mode: 'insensitive' } },
          { title: { contains: 'analytics', mode: 'insensitive' } },
          { description: { contains: 'data', mode: 'insensitive' } },
          { description: { contains: 'analyst', mode: 'insensitive' } }
        ]
      };
    } else if (roleTerm.includes('design') || roleTerm.includes('ux') || roleTerm.includes('ui')) {
      where.job = {
        OR: [
          { title: { contains: 'design', mode: 'insensitive' } },
          { title: { contains: 'ux', mode: 'insensitive' } },
          { title: { contains: 'ui', mode: 'insensitive' } },
          { description: { contains: 'design', mode: 'insensitive' } },
          { description: { contains: 'ux', mode: 'insensitive' } }
        ]
      };
    } else {
      where.job = {
        OR: [
          { title: { contains: targetRole.trim(), mode: 'insensitive' } },
          { description: { contains: targetRole.trim(), mode: 'insensitive' } },
        ],
      };
    }
  }

  const matches = await prisma.jobMatch.findMany({
    where,
    include: {
      job: true,
    },
    orderBy: [
      { created_at: 'desc' },
      { match_score: 'desc' }
    ],
    skip: (page - 1) * limit,
    take: Number(limit),
  });

  const total = await prisma.jobMatch.count({ where });

  // Filter by job properties
  let filtered = matches;
  if (job_type) filtered = filtered.filter((m) => m.job.job_type === job_type);
  if (location) filtered = filtered.filter((m) => m.job.location.toLowerCase().includes(location.toLowerCase()));
  if (source) filtered = filtered.filter((m) => m.job.source === source);

  return { jobs: filtered, total, page: Number(page), limit: Number(limit) };
}

module.exports = {
  fetchJobsForUser,
  getRecommendedJobs,
  fetchFromAdzuna,
  fetchFromRemotive,
  fetchFromTheMuse,
};
