// src/db/add_real_jobs.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JOBS_DATA = [
  {
    external_id: 'linkedin_data_analyst_infrabyte_001',
    source: 'LINKEDIN',
    title: 'Data Analyst Intern (Entry Level) | Power BI | Excel | SQL | Remote | PAN India',
    company: 'Infrabyte Consulting',
    location: 'India (Remote)',
    job_type: 'REMOTE',
    salary_min: 20000,
    salary_max: 25000,
    apply_url: 'https://www.linkedin.com/jobs/view/4429925273',
    description: 'Join Infrabyte Consulting as a Data Analyst Intern. Build and maintain automated reports, design SQL dashboard reports, and support operations teams. Work with Microsoft Power BI, Excel, and SQL.',
    requirements: 'Strong SQL skills, basic Excel, familiarity with Power BI, analytical mindset.'
  },
  {
    external_id: 'linkedin_data_analyst_neenopal_002',
    source: 'LINKEDIN',
    title: 'Data Analyst- SQL & Python (Remote Opportunity)',
    company: 'NeenOpal Inc.',
    location: 'India (Remote)',
    job_type: 'REMOTE',
    salary_min: 21000,
    salary_max: 26000,
    apply_url: 'https://www.linkedin.com/jobs/view/4420253744',
    description: 'NeenOpal is seeking a remote Data Analyst. Build robust data pipelines, analyze raw datasets to extract actionable business insights, and optimize database queries.',
    requirements: 'Advanced SQL queries, Python programming, familiarity with data pipelines, 1-2 years experience.'
  },
  {
    external_id: 'linkedin_data_analyst_websxum_003',
    source: 'LINKEDIN',
    title: 'Data Analyst Intern',
    company: 'Webs X UM',
    location: 'India (Remote)',
    job_type: 'REMOTE',
    salary_min: 18000,
    salary_max: 22000,
    apply_url: 'https://www.linkedin.com/jobs/view/4429591237',
    description: 'Data Analyst Intern position at Webs X UM. Clean raw customer transactional data using Python Pandas, run weekly analytical queries, and document business report presentations.',
    requirements: 'Basic Python, SQL, Excel, freshers welcome.'
  },
  {
    external_id: 'linkedin_data_analyst_wakeupwhistle_004',
    source: 'LINKEDIN',
    title: 'Data Analyst Intern',
    company: 'Wake Up Whistle',
    location: 'India (Remote)',
    job_type: 'REMOTE',
    salary_min: 19000,
    salary_max: 24000,
    apply_url: 'https://www.linkedin.com/jobs/view/4428710045',
    description: 'Wake Up Whistle is looking for a Data Analyst Intern. Perform data cleaning and transformation, design SQL dashboards, and present key metrics to product teams.',
    requirements: 'SQL scripting, data modeling, strong visualization skills, communication skills.'
  },
  {
    external_id: 'linkedin_data_analyst_skillzenloop_005',
    source: 'LINKEDIN',
    title: 'Healthcare Data Analyst Intern (Entry Level) | Healthcare Analytics | Excel | Reporting | Remote',
    company: 'Skillzenloop',
    location: 'India (Remote)',
    job_type: 'REMOTE',
    salary_min: 20000,
    salary_max: 23000,
    apply_url: 'https://www.linkedin.com/jobs/view/4427336141',
    description: 'Join Skillzenloop as a Healthcare Data Analyst Intern. Focus on healthcare analytics, design operational reporting sheets, organize patient and medical datasets, and run SQL audit queries.',
    requirements: 'SQL database queries, advanced Microsoft Excel, reporting experience, analytical mindset.'
  }
];

async function main() {
  console.log('🚀 Starting to seed LinkedIn Data Analytics jobs...');

  // 1. Insert/Upsert Jobs
  const createdJobs = [];
  for (const jobData of JOBS_DATA) {
    const job = await prisma.job.upsert({
      where: { external_id: jobData.external_id },
      update: {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        salary_min: jobData.salary_min,
        salary_max: jobData.salary_max,
        apply_url: jobData.apply_url,
        description: jobData.description,
        requirements: jobData.requirements,
      },
      create: jobData,
    });
    createdJobs.push(job);
    console.log(`✅ Upserted job: ${job.title} at ${job.company}`);
  }

  // 2. Fetch all users
  const users = await prisma.user.findMany();
  console.log(`👤 Found ${users.length} users in database.`);

  // 3. For each user, ensure they have a resume and create matches
  for (const user of users) {
    console.log(`\nProcessing matches for ${user.name} (${user.email})...`);

    // Get active resume
    let resume = await prisma.resume.findFirst({
      where: { user_id: user.id, is_active: true }
    });

    if (!resume) {
      resume = await prisma.resume.findFirst({
        where: { user_id: user.id }
      });
    }

    if (!resume) {
      // Create a dummy resume so the user has match capability
      resume = await prisma.resume.create({
        data: {
          user_id: user.id,
          file_url: 'https://supabase.co/dummy.pdf',
          file_name: 'resume_data_analyst.pdf',
          label: 'Data Analyst Resume',
          raw_text: 'Experienced Data Analyst skilled in Python, SQL, Tableau, and Excel. Strong quantitative background.',
          parsed_data: {
            name: user.name,
            skills: ['SQL', 'Python', 'Tableau', 'Excel', 'Pandas'],
            current_role: 'Data Analyst',
            total_experience_years: 2,
            summary: 'Data Analyst passionate about visual dashboards and database queries.'
          },
          is_active: true
        }
      });
      console.log(`✨ Created dummy resume for ${user.name}`);
    }

    // Associate matches
    for (const job of createdJobs) {
      const matchScore = 75 + (job.title.length + user.name.length) % 21; // High score between 75-95%
      
      const reasons = {
        match_score: matchScore,
        skills_matched: ['SQL', 'Python', 'Tableau', 'Excel'].filter(s => job.requirements.includes(s) || job.description.includes(s)),
        skills_missing: ['Redshift', 'ETL'].filter(s => job.requirements.includes(s) && !job.requirements.includes('SQL')),
        experience_fit: 'good',
        role_alignment: 'strong',
        summary: `Strong candidate matching user profile with high SQL/Python data analytical requirements.`
      };

      await prisma.jobMatch.upsert({
        where: {
          user_id_job_id_resume_id: {
            user_id: user.id,
            job_id: job.id,
            resume_id: resume.id
          }
        },
        update: {
          match_score: matchScore,
          match_reasons: reasons
        },
        create: {
          user_id: user.id,
          job_id: job.id,
          resume_id: resume.id,
          match_score: matchScore,
          match_reasons: reasons
        }
      });
      console.log(`🎯 Matched ${job.title} to ${user.name} with score ${matchScore}%`);
    }
  }

  console.log('\n🎉 Successfully seeded all jobs and generated recommendations!');
}

main()
  .catch((e) => {
    console.error('Error seeding jobs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
