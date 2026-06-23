const prisma = require('./src/db/prisma');
const jobService = require('./src/services/job.service');

async function testQuery() {
  try {
    const userId = '7ac94a01-3b00-4129-9de7-f45700f8c75b';
    const result = await jobService.getRecommendedJobs(userId, {
      limit: 4,
      min_score: 70
    });

    console.log(`API getRecommendedJobs returned ${result.jobs.length} jobs:`);
    result.jobs.forEach(m => {
      console.log(`- Job: ${m.job.title} at ${m.job.company} (Match Score: ${m.match_score}%)`);
    });

    // Let's print the actual preferences from DB again to be absolutely sure
    const prefs = await prisma.preference.findUnique({ where: { user_id: userId } });
    console.log('\nActual preferences in DB:', prefs);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
