const prisma = require('./src/db/prisma');

async function checkDb() {
  try {
    console.log('--- DB Check ---');
    const users = await prisma.user.findMany({
      include: {
        preferences: true,
        resumes: { where: { is_active: true } },
        _count: {
          select: { job_matches: true }
        }
      }
    });

    console.log('\nUsers, Preferences, and Resumes:');
    for (const u of users) {
      console.log(`\n- User: ${u.email} (ID: ${u.id})`);
      console.log(`  Matches Count: ${u._count.job_matches}`);
      console.log(`  Has Active Resume: ${u.resumes.length > 0 ? 'Yes' : 'No'}`);
      if (u.preferences) {
        console.log(`  Preferences: Target Roles: ${JSON.stringify(u.preferences.target_roles)}, Locations: ${JSON.stringify(u.preferences.target_locations)}, Autopilot: ${u.preferences.is_autopilot_active}`);
      } else {
        console.log(`  Preferences: None configured`);
      }
      
      if (u._count.job_matches > 0) {
        const matches = await prisma.jobMatch.findMany({
          where: { user_id: u.id },
          include: { job: true },
          orderBy: { match_score: 'desc' },
          take: 3
        });
        console.log(`  Top 3 matches:`);
        matches.forEach(m => {
          console.log(`    * [Score: ${m.match_score}%] ${m.job.title} at ${m.job.company} (Source: ${m.job.source}, Created At: ${m.job.created_at.toISOString()})`);
        });
      }
    }

  } catch (err) {
    console.error('Error running DB check:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
