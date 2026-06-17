// src/db/add_real_jobs.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JOBS_DATA = [
  {
    external_id: 'linkedin_data_analyst_google_001',
    source: 'LINKEDIN',
    title: 'Data Analyst - User Experience',
    company: 'Google',
    location: 'Bangalore, India',
    job_type: 'FULL_TIME',
    salary_min: 20000,
    salary_max: 22000,
    apply_url: 'https://www.linkedin.com/jobs/search/?keywords=Google%20Data%20Analyst&location=India',
    description: 'Analyze user behavior data across search and maps, design SQL dashboard reports, and identify growth opportunities using quantitative analysis.',
    requirements: 'Strong SQL skills, experience with Python or R, experience with Tableau or Google Data Studio, 2+ years experience in data analytics.'
  },
  {
    external_id: 'linkedin_data_analyst_amazon_002',
    source: 'LINKEDIN',
    title: 'Business Intelligence & Data Analyst',
    company: 'Amazon',
    location: 'Hyderabad, India',
    job_type: 'FULL_TIME',
    salary_min: 21000,
    salary_max: 24000,
    apply_url: 'https://www.linkedin.com/jobs/search/?keywords=Amazon%20Data%20Analyst&location=India',
    description: 'Translate complex datasets into actionable business insights. Build and maintain automated reports, query Redshift databases, and support operations teams.',
    requirements: 'Advanced SQL, Python scripting, Excel modeling, experience with AWS Redshift, 3+ years experience.'
  },
  {
    external_id: 'linkedin_data_analyst_tcs_003',
    source: 'LINKEDIN',
    title: 'Junior Data Analytics Associate',
    company: 'TCS',
    location: 'Chennai, India',
    job_type: 'FULL_TIME',
    salary_min: 18000,
    salary_max: 20000,
    apply_url: 'https://www.linkedin.com/jobs/search/?keywords=TCS%20Data&location=India',
    description: 'Clean raw customer transactional data using Python Pandas, run weekly analytical queries, and document business report presentations.',
    requirements: 'SQL queries, basic Python, Excel spreadsheets, analytical mindset, freshers or 1 year experience welcome.'
  },
  {
    external_id: 'linkedin_data_analyst_flipkart_004',
    source: 'LINKEDIN',
    title: 'Data Analyst (Remote)',
    company: 'Flipkart',
    location: 'Remote',
    job_type: 'REMOTE',
    salary_min: 20000,
    salary_max: 25000,
    apply_url: 'https://www.linkedin.com/jobs/search/?keywords=Flipkart%20Data&location=India',
    description: 'Design and analyze A/B testing models for customer search algorithms, monitor conversion rates, and build cross-functional reporting tools.',
    requirements: 'Python/R statistical programming, advanced SQL, product analytics experience, strong communication.'
  },
  {
    external_id: 'linkedin_data_analyst_infosys_005',
    source: 'LINKEDIN',
    title: 'Data Analytics Engineer',
    company: 'Infosys',
    location: 'Pune, India',
    job_type: 'FULL_TIME',
    salary_min: 19000,
    salary_max: 21000,
    apply_url: 'https://www.linkedin.com/jobs/search/?keywords=Infosys%20Data&location=India',
    description: 'Build robust ET data pipelines, support dashboard reporting tools, clean raw databases, and optimize query latency for client projects.',
    requirements: 'ETL pipelines, SQL database management, Python, Tableau or PowerBI dashboards.'
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
