// src/services/job.service.js
const axios = require('axios');
const prisma = require('../db/prisma');
const env = require('../config/env');
const logger = require('../utils/logger');

// ── Constants ────────────────────────────────────────────────────────────────
const JOB_EXPIRY_DAYS = 30;
const REQUEST_TIMEOUT = 12000;

// ── LinkedIn Health Tracking ─────────────────────────────────────────────────
let linkedInFailStreak = 0;
const LINKEDIN_DEGRADE_THRESHOLD = 3;

function getLinkedInHealth() {
  return {
    streak: linkedInFailStreak,
    status: linkedInFailStreak >= LINKEDIN_DEGRADE_THRESHOLD ? 'DEGRADED' : 'OK',
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcExpiresAt(postedAt) {
  const d = postedAt ? new Date(postedAt) : new Date();
  d.setDate(d.getDate() + JOB_EXPIRY_DAYS);
  return d;
}

function stripHtml(html = '') {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

/**
 * Deactivate jobs older than JOB_EXPIRY_DAYS. Run before every fetch cycle.
 */
async function cleanupExpiredJobs() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - JOB_EXPIRY_DAYS);
  try {
    const result = await prisma.job.updateMany({
      where: {
        is_active: true,
        OR: [
          { posted_at: { lt: cutoff } },
          { expires_at: { lt: new Date() } },
        ],
      },
      data: { is_active: false },
    });
    if (result.count > 0) {
      logger.info(`🧹 Expired ${result.count} stale jobs (>${JOB_EXPIRY_DAYS} days old)`);
    }
    return result.count;
  } catch (err) {
    logger.error('Job cleanup failed:', err.message);
    return 0;
  }
}

// ── Adzuna ───────────────────────────────────────────────────────────────────

async function fetchFromAdzuna(targetRoles = [], locations = []) {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
    logger.warn('⚠️ Adzuna credentials not configured');
    return [];
  }
  const jobs = [];
  for (const role of targetRoles.slice(0, 3)) {
    for (const location of locations.slice(0, 2)) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/${env.ADZUNA_COUNTRY}/search/1`;
        const { data } = await axios.get(url, {
          timeout: REQUEST_TIMEOUT,
          params: {
            app_id: env.ADZUNA_APP_ID,
            app_key: env.ADZUNA_APP_KEY,
            what: role,
            where: location === 'Remote' ? '' : location,
            results_per_page: 20,
            content_type: 'application/json',
            sort_by: 'date',
          },
        });
        for (const job of (data.results || [])) {
          const postedAt = job.created ? new Date(job.created) : new Date();
          jobs.push({
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
            apply_url: job.redirect_url || '#',
            posted_at: postedAt,
            expires_at: calcExpiresAt(postedAt),
          });
        }
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        logger.error(`Adzuna failed for "${role}" / "${location}":`, err.message);
      }
    }
  }
  return jobs;
}

// ── Remotive ────────────────────────────────────────────────────────────────────────

async function fetchFromRemotive(targetRoles = []) {
  const jobs = [];
  const rolesToFetch = targetRoles.slice(0, 3).length > 0 ? targetRoles.slice(0, 3) : ['software engineer'];
  for (const role of rolesToFetch) {
    try {
      const { data } = await axios.get(env.REMOTIVE_API_URL, {
        params: { search: role, limit: 50 },
        timeout: REQUEST_TIMEOUT,
      });
      const fetched = (data.jobs || []).map((job) => {
        const postedAt = job.publication_date ? new Date(job.publication_date) : new Date();
        return {
          external_id: `remotive_${job.id}`,
          source: 'REMOTIVE',
          title: job.title,
          company: job.company_name,
          location: job.candidate_required_location || 'Remote',
          job_type: 'REMOTE',
          description: stripHtml(job.description || ''),
          requirements: '',
          salary_min: null, salary_max: null,
          apply_url: job.url,
          posted_at: postedAt,
          expires_at: calcExpiresAt(postedAt),
        };
      });
      logger.info(`  Remotive "${role}": ${fetched.length} jobs`);
      jobs.push(...fetched);
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      logger.error(`Remotive failed for "${role}":`, err.message);
    }
  }
  return jobs;
}

// ── The Muse ─────────────────────────────────────────────────────────────────

async function fetchFromTheMuse(targetRoles = []) {
  try {
    const { data } = await axios.get('https://www.themuse.com/api/public/jobs', {
      params: { category: mapRoleToMuseCategory(targetRoles[0]), page: 1, api_key: env.THEMUSE_API_KEY || undefined },
      timeout: REQUEST_TIMEOUT,
    });
    return (data.results || []).map((job) => {
      const postedAt = job.publication_date ? new Date(job.publication_date) : new Date();
      return {
        external_id: `themuse_${job.id}`,
        source: 'THEMUSE',
        title: job.name,
        company: job.company?.name || 'Unknown',
        location: job.locations?.[0]?.name || 'Remote',
        job_type: job.locations?.[0]?.name?.toLowerCase().includes('remote') ? 'REMOTE' : 'FULL_TIME',
        description: stripHtml(job.contents || ''),
        requirements: '',
        salary_min: null, salary_max: null,
        apply_url: job.refs?.landing_page || '#',
        posted_at: postedAt,
        expires_at: calcExpiresAt(postedAt),
      };
    });
  } catch (err) {
    logger.error('TheMuse failed:', err.message);
    return [];
  }
}

function mapRoleToMuseCategory(role = '') {
  const r = role.toLowerCase();
  if (r.includes('software') || r.includes('engineer') || r.includes('developer')) return 'Software Engineer';
  if (r.includes('data') || r.includes('analyst') || r.includes('ml') || r.includes('ai')) return 'Data Science';
  if (r.includes('devops') || r.includes('cloud')) return 'DevOps & Sysadmin';
  if (r.includes('product')) return 'Product';
  if (r.includes('design')) return 'Design & UX';
  if (r.includes('health') || r.includes('clinical') || r.includes('medical') || r.includes('nurse')) return 'Healthcare';
  if (r.includes('finance') || r.includes('account')) return 'Finance';
  return 'Software Engineer';
}

// ── LinkedIn (Public Guest API) ──────────────────────────────────────────────
// LinkedIn's guest job search endpoint — no auth or API key required.

async function fetchFromLinkedIn(targetRoles = [], locations = []) {
  const jobs = [];
  const roles = targetRoles.slice(0, 2);
  const locs = locations.length > 0 ? locations.slice(0, 2) : ['India'];

  for (const role of roles) {
    for (const location of locs) {
      try {
        logger.info(`🔗 LinkedIn: fetching "${role}" in "${location}"`);
        const { data: html } = await axios.get(
          'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search',
          {
            params: {
              keywords: role,
              location: location === 'Remote' ? '' : location,
              start: 0,
              count: 25,
              f_TPR: 'r604800', // Posted in last 7 days
              sortBy: 'DD',
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: REQUEST_TIMEOUT,
          }
        );

        const jobIdMatches = [...html.matchAll(/data-entity-urn="urn:li:jobPosting:(\d+)"/g)];
        const titleMatches = [...html.matchAll(/class="base-search-card__title"[^>]*>\s*(.*?)\s*<\/h3>/gs)];
        const companyMatches = [...html.matchAll(/class="base-search-card__subtitle"[^>]*>[\s\S]*?<a[^>]*>(.*?)<\/a>/g)];
        const locationMatches = [...html.matchAll(/class="job-search-card__location"[^>]*>(.*?)<\/span>/gs)];
        const dateMatches = [...html.matchAll(/datetime="([^"]+)"/g)];

        const count = Math.min(jobIdMatches.length, titleMatches.length);
        for (let i = 0; i < count; i++) {
          const jobId = jobIdMatches[i]?.[1];
          const title = titleMatches[i]?.[1]?.trim().replace(/\s+/g, ' ');
          const company = companyMatches[i]?.[1]?.trim().replace(/\s+/g, ' ');
          const jobLocation = locationMatches[i]?.[1]?.trim() || location;
          const postedAt = dateMatches[i]?.[1] ? new Date(dateMatches[i][1]) : new Date();
          if (!jobId || !title) continue;
          jobs.push({
            external_id: `linkedin_${jobId}`,
            source: 'LINKEDIN',
            title: stripHtml(title),
            company: stripHtml(company || 'Unknown Company'),
            location: stripHtml(jobLocation),
            job_type: jobLocation.toLowerCase().includes('remote') ? 'REMOTE' : 'FULL_TIME',
            description: `${title} at ${company || 'this company'}. Apply via LinkedIn for full details.`,
            requirements: '',
            salary_min: null, salary_max: null,
            apply_url: `https://www.linkedin.com/jobs/view/${jobId}`,
            posted_at: postedAt,
            expires_at: calcExpiresAt(postedAt),
          });
        }

        // ── Health check: track consecutive empty scrape results ─────────────
        const foundForThisBatch = Math.min(jobIdMatches.length, titleMatches.length);
        if (foundForThisBatch === 0) {
          linkedInFailStreak++;
          logger.warn(
            `⚠️ LinkedIn: 0 jobs parsed for "${role}" in "${location}" ` +
            `(fail streak: ${linkedInFailStreak}/${LINKEDIN_DEGRADE_THRESHOLD}). ` +
            `HTML snippet: ${html.substring(0, 300).replace(/\s+/g, ' ')}`
          );
          if (linkedInFailStreak >= LINKEDIN_DEGRADE_THRESHOLD) {
            logger.warn(
              '🚨 LINKEDIN_SCRAPE_DEGRADED — LinkedIn HTML structure may have changed. ' +
              'Manual inspection of the guest search endpoint is required.'
            );
          }
        } else {
          // Reset streak on any successful parse
          linkedInFailStreak = 0;
        }

        logger.info(`🔗 LinkedIn: found ${foundForThisBatch} jobs for "${role}" in "${location}"`);
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        logger.error(`LinkedIn failed for "${role}" / "${location}":`, err.message);
      }
    }
  }
  return jobs;
}

// ── Indeed via RemoteOK ──────────────────────────────────────────────────────
// NOTE: Despite the function name and DB source enum value ('INDEED'), this
// fetcher actually pulls from RemoteOK (remoteok.com), a free public API with
// 100+ live remote tech jobs and no API key required.
// The enum value 'INDEED' is preserved to avoid a Prisma DB migration.
// The frontend displays this as "RemoteOK" using lib/sourceLabels.js.


async function fetchFromIndeed(targetRoles = [], locations = []) {
  const jobs = [];
  try {
    logger.info(`🔍 Indeed/RemoteOK: fetching remote tech jobs...`);
    const { data } = await axios.get('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: REQUEST_TIMEOUT,
    });

    const rawJobs = Array.isArray(data) ? data.slice(1) : [];
    const roleKeywords = targetRoles.map((r) => r.toLowerCase());
    const filtered = roleKeywords.length > 0
      ? rawJobs.filter((job) => {
          const haystack = `${job.position || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
          return roleKeywords.some((kw) => haystack.includes(kw.split(' ')[0]));
        })
      : rawJobs;

    const jobsToUse = filtered.slice(0, 30);
    logger.info(`🔍 RemoteOK: ${jobsToUse.length} matching jobs (from ${rawJobs.length} total)`);

    for (const job of jobsToUse) {
      const postedAt = job.date ? new Date(job.date) : new Date();
      jobs.push({
        external_id: `indeed_ro_${job.id || job.slug || String(Math.random()).slice(2, 12)}`,
        source: 'INDEED',
        title: job.position || 'Remote Job',
        company: job.company || 'Unknown Company',
        location: 'Remote',
        job_type: 'REMOTE',
        description: stripHtml(job.description || `${job.position} at ${job.company}. Tags: ${(job.tags || []).join(', ')}`).substring(0, 2000),
        requirements: (job.tags || []).join(', '),
        salary_min: job.salary_min || null,
        salary_max: job.salary_max || null,
        apply_url: job.url || `https://remoteok.com/jobs/${job.id}`,
        posted_at: postedAt,
        expires_at: calcExpiresAt(postedAt),
      });
    }
  } catch (err) {
    logger.error(`Indeed/RemoteOK failed:`, err.message);
  }
  return jobs;
}

// ── Naukri via Jobicy ─────────────────────────────────────────────────────────────
// Naukri's API requires reCAPTCHA. We use Jobicy (free, no key needed)
// which aggregates real remote roles. Tagged NAUKRI for the platform UI.

async function fetchFromNaukri(targetRoles = [], locations = []) {
  const jobs = [];
  const rolesToFetch = targetRoles.slice(0, 2).length > 0 ? targetRoles.slice(0, 2) : ['software engineer'];
  for (const role of rolesToFetch) {
    try {
      logger.info(`🇮🇳 Naukri/Jobicy: fetching jobs for "${role}"...`);
      const params = { count: 50 };
      // Use first meaningful keyword as tag (skip generic short words)
      const words = role.toLowerCase().split(' ').filter(w => w.length > 3 && !['and', 'the', 'for', 'with'].includes(w));
      const keyword = words[0] || '';
      if (keyword) params.tag = keyword;

      const { data } = await axios.get('https://jobicy.com/api/v2/remote-jobs', {
        params,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      });

      const jobList = data?.jobs || [];
      logger.info(`🇮🇳 Jobicy "${role}": ${jobList.length} jobs returned`);

      for (const job of jobList) {
        const postedAt = job.pubDate ? new Date(job.pubDate) : new Date();
        jobs.push({
          external_id: `naukri_jobicy_${job.id || String(Math.random()).slice(2, 12)}`,
          source: 'NAUKRI',
          title: job.jobTitle || role,
          company: job.companyName || 'Unknown Company',
          location: job.jobGeo || 'Remote',
          job_type: 'REMOTE',
          description: stripHtml(job.jobExcerpt || job.jobDescription || `${job.jobTitle} at ${job.companyName}`).substring(0, 2000),
          requirements: Array.isArray(job.jobType) ? job.jobType.join(', ') : (job.jobType || ''),
          salary_min: null, salary_max: null,
          apply_url: job.url || `https://jobicy.com/jobs/${job.id}`,
          posted_at: postedAt,
          expires_at: calcExpiresAt(postedAt),
        });
      }
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      logger.error(`Naukri/Jobicy failed for "${role}":`, err.message);
    }
  }
  return jobs;
}

// ── Deduplication & DB Upsert ────────────────────────────────────────────────

async function deduplicateAndSaveJobs(rawJobs) {
  let created = 0;
  let updated = 0;

  for (const jobData of rawJobs) {
    try {
      const existing = await prisma.job.findUnique({
        where: { external_id: jobData.external_id },
        select: { id: true },
      });

      await prisma.job.upsert({
        where: { external_id: jobData.external_id },
        update: {
          is_active: true,
          expires_at: jobData.expires_at,
          description: jobData.description || undefined,
        },
        create: jobData,
      });

      if (existing) updated++;
      else created++;
    } catch (err) {
      logger.error(`Failed to save job ${jobData.external_id}:`, err.message);
    }
  }

  return { created, updated, total: rawJobs.length };
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────

/**
 * Fetch fresh jobs from all 6 sources for a user's preferences.
 * Runs cleanup first to expire stale jobs.
 */
async function fetchJobsForUser(preferences) {
  const { target_roles = [], target_locations = [] } = preferences;
  logger.info(`🔍 Full job fetch for roles: ${target_roles.join(', ')}`);

  // Step 1: Clean up expired jobs BEFORE fetching
  const expiredCount = await cleanupExpiredJobs();
  logger.info(`🧹 Cleanup: deactivated ${expiredCount} expired jobs`);

  // Step 2: Fetch from all 6 sources concurrently
  logger.info('📡 Fetching from Adzuna, Remotive, TheMuse, LinkedIn, Indeed (RemoteOK), Naukri (Jobicy)...');
  const [adzunaRes, remotiveRes, museRes, linkedInRes, indeedRes, naukriRes] =
    await Promise.allSettled([
      fetchFromAdzuna(target_roles, target_locations),
      fetchFromRemotive(target_roles),
      fetchFromTheMuse(target_roles),
      fetchFromLinkedIn(target_roles, target_locations),
      fetchFromIndeed(target_roles, target_locations),
      fetchFromNaukri(target_roles, target_locations),
    ]);

  const sourceMap = [
    ['Adzuna', adzunaRes],
    ['Remotive', remotiveRes],
    ['TheMuse', museRes],
    ['LinkedIn', linkedInRes],
    ['Indeed', indeedRes],
    ['Naukri', naukriRes],
  ];

  const allJobs = [];
  for (const [name, result] of sourceMap) {
    if (result.status === 'fulfilled') {
      logger.info(`  ✓ ${name}: ${result.value.length} jobs`);
      allJobs.push(...result.value);
    } else {
      logger.error(`  ✗ ${name} rejected:`, result.reason?.message || result.reason);
    }
  }

  logger.info(`📦 Total fetched: ${allJobs.length} jobs across all sources`);
  const stats = await deduplicateAndSaveJobs(allJobs);
  logger.info(`✅ Saved: ${stats.created} new, ${stats.updated} refreshed, ${stats.total} total processed`);
  return stats;
}

// ── Recommended Jobs Query ────────────────────────────────────────────────────

async function getRecommendedJobs(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    min_score = 50,
    job_type,
    location,
    source,
    search,
    saved_only = false,
  } = options;

  // Build job-level filters (applied inside the match join)
  const jobFilter = {
    is_active: true,
    ...(job_type ? { job_type } : {}),
    ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
    ...(source ? { source } : {}),
    // Text search: match title, company, or description
    ...(search?.trim()
      ? {
          OR: [
            { title: { contains: search.trim(), mode: 'insensitive' } },
            { company: { contains: search.trim(), mode: 'insensitive' } },
            { description: { contains: search.trim(), mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  // NOTE: buildRoleFilter is intentionally NOT applied here.
  // The AI match_score already handles job-resume relevance.
  // Filtering by job title would block valid cross-role matches.

  const where = {
    user_id: userId,
    match_score: { gte: Number(min_score) },
    ...(saved_only && { is_saved: true }),
    job: jobFilter,
  };

  const [matches, total] = await Promise.all([
    prisma.jobMatch.findMany({
      where,
      include: { job: true },
      orderBy: [{ match_score: 'desc' }, { created_at: 'desc' }],
      skip: (page - 1) * limit,
      take: Number(limit),
    }),
    prisma.jobMatch.count({ where }),
  ]);

  return { jobs: matches, total, page: Number(page), limit: Number(limit) };
}

function buildRoleFilter(roleTerm) {
  if (roleTerm.includes('react')) {
    return { OR: [{ title: { contains: 'react', mode: 'insensitive' } }, { description: { contains: 'react', mode: 'insensitive' } }] };
  }
  if (roleTerm.includes('data') || roleTerm.includes('analyst')) {
    return { OR: [{ title: { contains: 'data', mode: 'insensitive' } }, { title: { contains: 'analyst', mode: 'insensitive' } }] };
  }
  if (roleTerm.includes('design') || roleTerm.includes('ux')) {
    return { OR: [{ title: { contains: 'design', mode: 'insensitive' } }, { title: { contains: 'ux', mode: 'insensitive' } }] };
  }
  return { OR: [{ title: { contains: roleTerm, mode: 'insensitive' } }, { description: { contains: roleTerm, mode: 'insensitive' } }] };
}

module.exports = {
  fetchJobsForUser,
  getRecommendedJobs,
  cleanupExpiredJobs,
  fetchFromAdzuna,
  fetchFromRemotive,
  fetchFromTheMuse,
  fetchFromLinkedIn,
  fetchFromIndeed,
  fetchFromNaukri,
  getLinkedInHealth,
};
