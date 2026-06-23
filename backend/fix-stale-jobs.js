/**
 * fix-stale-jobs.js
 * One-time fix: activates all inactive resumes that have no active sibling,
 * then triggers a fresh job fetch + match for all users.
 * Run once: node fix-stale-jobs.js
 */
require('dotenv').config();
const prisma = require('./src/db/prisma');
const jobService = require('./src/services/job.service');
const { scoreJobMatch } = require('./src/ai/jobMatcher');
const logger = require('./src/utils/logger');

async function run() {
  console.log('\n=== JobPilot Fix: Stale Jobs + Resume Activation ===\n');

  // 1. Find all users with preferences
  const users = await prisma.user.findMany({
    include: { preferences: true },
    where: { preferences: { isNot: null } },
  });

  console.log(`Found ${users.length} users with preferences\n`);

  for (const user of users) {
    console.log(`\n--- User: ${user.email} ---`);

    // 2. Check resume status
    const activeResume = await prisma.resume.findFirst({
      where: { user_id: user.id, is_active: true },
      orderBy: { created_at: 'desc' },
    });

    if (!activeResume) {
      const latest = await prisma.resume.findFirst({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
      });

      if (latest) {
        await prisma.resume.update({
          where: { id: latest.id },
          data: { is_active: true },
        });
        console.log(`  ✅ Activated resume: ${latest.id} (${latest.label || latest.file_name})`);
      } else {
        console.log(`  ⚠️  No resume found — skipping match step`);
        continue;
      }
    } else {
      console.log(`  ℹ️  Resume already active: ${activeResume.id}`);
    }

    // Get the now-active resume
    const resume = await prisma.resume.findFirst({
      where: { user_id: user.id, is_active: true },
      orderBy: { created_at: 'desc' },
    });

    // 3. Fetch fresh jobs
    if (user.preferences) {
      console.log(`  📡 Fetching jobs for roles: ${(user.preferences.target_roles || []).join(', ')}`);
      try {
        const stats = await jobService.fetchJobsForUser(user.preferences);
        console.log(`  📦 Fetch done: ${stats.created} new, ${stats.updated} refreshed, ${stats.total} total`);
      } catch (e) {
        console.error(`  ❌ Fetch failed: ${e.message}`);
      }
    }

    if (!resume || !resume.parsed_data) {
      console.log(`  ⚠️  Resume has no parsed data — skipping match step`);
      continue;
    }

    // 4. Score all unmatched active jobs (up to 200)
    const unmatched = await prisma.job.findMany({
      where: {
        is_active: true,
        job_matches: { none: { user_id: user.id } },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    });

    console.log(`  🔍 Scoring ${unmatched.length} unmatched jobs...`);
    let matched = 0;
    for (const j of unmatched) {
      try {
        const matchResult = await scoreJobMatch(resume.parsed_data, j);
        await prisma.jobMatch.create({
          data: {
            user_id: user.id,
            job_id: j.id,
            resume_id: resume.id,
            match_score: matchResult.match_score,
            match_reasons: matchResult,
          },
        });
        matched++;
        if (matched % 20 === 0) console.log(`    → ${matched} matches created so far...`);
      } catch (e) {
        // skip individual failures
      }
    }
    console.log(`  ✅ Created ${matched} new job matches for ${user.email}`);

    // 5. Show current match count
    const totalMatches = await prisma.jobMatch.count({ where: { user_id: user.id } });
    const totalActiveMatches = await prisma.jobMatch.count({
      where: { user_id: user.id, job: { is_active: true } },
    });
    console.log(`  📊 Total matches in DB: ${totalMatches} (${totalActiveMatches} with active jobs)`);
  }

  // Final summary
  const totalJobs = await prisma.job.count();
  const activeJobs = await prisma.job.count({ where: { is_active: true } });
  const mostRecent = await prisma.job.findFirst({ orderBy: { created_at: 'desc' } });
  console.log(`\n=== Summary ===`);
  console.log(`Total jobs in DB: ${totalJobs} (${activeJobs} active)`);
  console.log(`Most recent job created_at: ${mostRecent?.created_at}`);
  console.log(`\nDone! ✅`);
  
  await prisma.$disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
