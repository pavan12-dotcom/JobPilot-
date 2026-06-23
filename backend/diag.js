require('dotenv').config();
const prisma = require('./src/db/prisma');
async function check() {
  const totalMatches = await prisma.jobMatch.count();
  const activeMatches = await prisma.jobMatch.count({ where: { job: { is_active: true } } });
  const top5 = await prisma.jobMatch.findMany({
    where: { job: { is_active: true } },
    include: { job: { select: { title: true, source: true, is_active: true } } },
    orderBy: { match_score: 'desc' },
    take: 5,
  });
  console.log('Total matches:', totalMatches, '| Active job matches:', activeMatches);
  top5.forEach(m => console.log(' -', m.match_score + '%', '|', m.job.title, '(', m.job.source, ')'));
  const prefs = await prisma.preference.findFirst();
  console.log('Preferences target_roles:', JSON.stringify(prefs?.target_roles));
  const totalJobs = await prisma.job.count();
  const activeJobs = await prisma.job.count({ where: { is_active: true } });
  console.log('Total jobs in DB:', totalJobs, '| Active jobs:', activeJobs);
  await prisma.$disconnect();
}
check().catch(e => { console.error(e.message); process.exit(1); });
