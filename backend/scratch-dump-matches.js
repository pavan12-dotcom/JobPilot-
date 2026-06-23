const prisma = require('./src/db/prisma');

async function dumpMatches() {
  try {
    const userId = '7ac94a01-3b00-4129-9de7-f45700f8c75b'; // pt6182086@gmail.com
    const matches = await prisma.jobMatch.findMany({
      where: { user_id: userId },
      include: { job: true, resume: true },
      orderBy: { created_at: 'desc' }
    });

    console.log(`Found ${matches.length} matches for pt6182086@gmail.com:`);
    matches.forEach(m => {
      console.log(`- Match ID: ${m.id}`);
      console.log(`  Job: ${m.job.title} at ${m.job.company} (ID: ${m.job.id})`);
      console.log(`  Score: ${m.match_score}%`);
      console.log(`  Match Created At: ${m.created_at.toISOString()}`);
      console.log(`  Resume ID: ${m.resume_id} (Active: ${m.resume?.is_active}, Label: ${m.resume?.label})`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

dumpMatches();
