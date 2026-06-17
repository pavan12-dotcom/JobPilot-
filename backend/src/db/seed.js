// src/db/seed.js — Demo data seeder
require('dotenv').config({ path: '../../../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo data...');

  // ── 1. Demo User ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@applyai.dev' },
    update: {},
    create: {
      id: 'demo-user-001',
      email: 'demo@applyai.dev',
      name: 'Alex Kumar',
      password_hash: passwordHash,
      is_premium: true,
      daily_apply_limit: 20,
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ApplyAI',
    },
  });
  console.log(`✅ User: ${user.email}`);

  // ── 2. Resume ────────────────────────────────────────────────
  const resume = await prisma.resume.upsert({
    where: { id: 'demo-resume-001' },
    update: {},
    create: {
      id: 'demo-resume-001',
      user_id: user.id,
      file_url: 'https://example.com/resumes/alex-kumar.pdf',
      file_name: 'Alex_Kumar_Resume.pdf',
      raw_text: 'Alex Kumar | alex@email.com | +91 9876543210\n\nExperience:\nSoftware Engineer at TechCorp (2022-2024)\nBuilt scalable APIs using Node.js and PostgreSQL\nDeveloped React dashboards for 100k+ users\n\nJunior Developer at StartupXYZ (2021-2022)\nWorked on Python data pipelines and AWS Lambda\n\nEducation:\nB.Tech ECE - IIT Bangalore (2021)\nCGPA: 8.7/10\n\nSkills: React, Node.js, Python, PostgreSQL, AWS, Docker, Redis, TypeScript, Next.js',
      parsed_data: {
        name: 'Alex Kumar',
        email: 'alex@email.com',
        phone: '+91 9876543210',
        skills: ['React', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker', 'Redis', 'TypeScript', 'Next.js', 'Express.js', 'GraphQL', 'Git'],
        experience: [
          { company: 'TechCorp', role: 'Software Engineer', years: 2, description: 'Built scalable APIs using Node.js and PostgreSQL. Developed React dashboards for 100k+ users.' },
          { company: 'StartupXYZ', role: 'Junior Developer', years: 1, description: 'Worked on Python data pipelines and AWS Lambda functions.' },
        ],
        education: [
          { degree: 'B.Tech Electronics & Communication Engineering', college: 'IIT Bangalore', year: 2021 },
        ],
        total_experience_years: 3,
        current_role: 'Software Engineer',
        preferred_roles: ['Software Engineer', 'Backend Developer', 'Full Stack Developer', 'Node.js Developer'],
        summary: 'Experienced software engineer with 3 years building scalable web applications using Node.js, React, and PostgreSQL. Passionate about clean code and developer experience.',
      },
      is_active: true,
    },
  });
  console.log(`✅ Resume: ${resume.file_name}`);

  const resume2 = await prisma.resume.upsert({
    where: { id: 'demo-resume-002' },
    update: {},
    create: {
      id: 'demo-resume-002',
      user_id: user.id,
      file_url: 'https://example.com/resumes/alex-kumar-ds.pdf',
      file_name: 'Alex_Kumar_Data_Science_Resume.pdf',
      label: 'Data Science Resume',
      raw_text: 'Alex Kumar | alex@email.com | +91 9876543210\n\nExperience:\nData Scientist at Analytics Corp (2022-2024)\nBuilt ML pipelines and deployed NLP models using Python and PyTorch\nDesigned A/B tests and statistical validation algorithms\n\nJunior Analyst at DataXYZ (2021-2022)\nWorked on data cleaning, ETL pipelines, and SQL queries\n\nEducation:\nB.Tech ECE - IIT Bangalore (2021)\nCGPA: 8.7/10\n\nSkills: Python, PyTorch, SQL, Pandas, NumPy, Scikit-learn, Tableau, AWS SageMaker, Docker, Git, Machine Learning, Deep Learning',
      parsed_data: {
        name: 'Alex Kumar',
        email: 'alex@email.com',
        phone: '+91 9876543210',
        skills: ['Python', 'PyTorch', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'Tableau', 'AWS SageMaker', 'Docker', 'Git', 'Machine Learning', 'Deep Learning', 'NLP', 'A/B Testing'],
        experience: [
          { company: 'Analytics Corp', role: 'Data Scientist', years: 2, description: 'Built ML pipelines and deployed NLP models using Python and PyTorch. Designed A/B tests.' },
          { company: 'DataXYZ', role: 'Junior Analyst', years: 1, description: 'Worked on data cleaning, ETL pipelines, and SQL queries.' },
        ],
        education: [
          { degree: 'B.Tech Electronics & Communication Engineering', college: 'IIT Bangalore', year: 2021 },
        ],
        total_experience_years: 3,
        current_role: 'Data Scientist',
        preferred_roles: ['Data Scientist', 'Machine Learning Engineer', 'Data Analyst', 'AI Engineer'],
        summary: 'Experienced data scientist with 3 years building predictive models and end-to-end ML pipelines. Skilled in python, deep learning, and advanced analytics.',
      },
      is_active: false,
    },
  });
  console.log(`✅ Resume 2: ${resume2.file_name}`);

  // ── 3. Preferences ──────────────────────────────────────────
  await prisma.preference.upsert({
    where: { user_id: user.id },
    update: {},
    create: {
      user_id: user.id,
      target_roles: ['Software Engineer', 'Backend Developer', 'Full Stack Developer'],
      target_locations: ['Bangalore', 'Hyderabad', 'Remote'],
      min_salary: 1200000, // 12 LPA
      max_salary: 3000000, // 30 LPA
      job_types: ['FULL_TIME', 'REMOTE'],
      experience_level: 'MID',
      blacklisted_companies: ['BadCorp Inc'],
      preferred_companies: ['Google', 'Microsoft', 'Swiggy', 'Zomato'],
      auto_apply_enabled: true,
      min_match_score: 70,
    },
  });
  console.log('✅ Preferences saved');

  // ── 4. Sample Jobs ──────────────────────────────────────────
  const jobs = [
    { title: 'Senior Software Engineer', company: 'Google', location: 'Bangalore', source: 'ADZUNA', score: 94, salary_min: 2500000, salary_max: 4000000, job_type: 'FULL_TIME' },
    { title: 'Backend Engineer (Node.js)', company: 'Swiggy', location: 'Bangalore', source: 'ADZUNA', score: 89, salary_min: 1800000, salary_max: 3000000, job_type: 'FULL_TIME' },
    { title: 'Full Stack Developer', company: 'Razorpay', location: 'Bangalore', source: 'ADZUNA', score: 86, salary_min: 2000000, salary_max: 3500000, job_type: 'FULL_TIME' },
    { title: 'Node.js Developer', company: 'Zomato', location: 'Remote', source: 'REMOTIVE', score: 82, salary_min: 1500000, salary_max: 2500000, job_type: 'REMOTE' },
    { title: 'Software Engineer II', company: 'Microsoft', location: 'Hyderabad', source: 'ADZUNA', score: 88, salary_min: 2200000, salary_max: 3800000, job_type: 'FULL_TIME' },
    { title: 'React + Node.js Engineer', company: 'Freshworks', location: 'Chennai', source: 'ADZUNA', score: 79, salary_min: 1600000, salary_max: 2800000, job_type: 'FULL_TIME' },
    { title: 'Backend Developer (Python)', company: 'CRED', location: 'Bangalore', source: 'ADZUNA', score: 72, salary_min: 1800000, salary_max: 3200000, job_type: 'FULL_TIME' },
    { title: 'Remote Full Stack Engineer', company: 'GitLab', location: 'Remote', source: 'REMOTIVE', score: 85, salary_min: 3000000, salary_max: 5000000, job_type: 'REMOTE' },
    { title: 'API Engineer', company: 'Stripe', location: 'Remote', source: 'THEMUSE', score: 91, salary_min: 3500000, salary_max: 6000000, job_type: 'REMOTE' },
    { title: 'Software Engineer', company: 'Atlassian', location: 'Remote', source: 'REMOTIVE', score: 80, salary_min: 2800000, salary_max: 4500000, job_type: 'REMOTE' },
    { title: 'Junior Backend Developer', company: 'Paytm', location: 'Noida', source: 'ADZUNA', score: 65, salary_min: 800000, salary_max: 1500000, job_type: 'FULL_TIME' },
    { title: 'DevOps Engineer', company: 'Infosys', location: 'Pune', source: 'ADZUNA', score: 58, salary_min: 1200000, salary_max: 2000000, job_type: 'FULL_TIME' },
    { title: 'TypeScript Developer', company: 'Vercel', location: 'Remote', source: 'THEMUSE', score: 88, salary_min: 3200000, salary_max: 5500000, job_type: 'REMOTE' },
    { title: 'Platform Engineer', company: 'Cloudflare', location: 'Remote', source: 'REMOTIVE', score: 76, salary_min: 3000000, salary_max: 5000000, job_type: 'REMOTE' },
    { title: 'Software Engineer - Growth', company: 'PhonePe', location: 'Bangalore', source: 'ADZUNA', score: 83, salary_min: 2000000, salary_max: 3500000, job_type: 'FULL_TIME' },
    { title: 'Backend Lead', company: 'Zepto', location: 'Mumbai', source: 'ADZUNA', score: 77, salary_min: 2500000, salary_max: 4000000, job_type: 'FULL_TIME' },
    { title: 'Full Stack Engineer', company: 'Linear', location: 'Remote', source: 'THEMUSE', score: 92, salary_min: 4000000, salary_max: 7000000, job_type: 'REMOTE' },
    { title: 'Node.js Backend Engineer', company: 'Ola', location: 'Bangalore', source: 'ADZUNA', score: 81, salary_min: 1800000, salary_max: 3000000, job_type: 'FULL_TIME' },
    { title: 'Software Developer', company: 'Meesho', location: 'Bangalore', source: 'ADZUNA', score: 74, salary_min: 1600000, salary_max: 2800000, job_type: 'FULL_TIME' },
    { title: 'Cloud Engineer (AWS)', company: 'Amazon', location: 'Hyderabad', source: 'ADZUNA', score: 70, salary_min: 2200000, salary_max: 3800000, job_type: 'FULL_TIME' },
  ];

  const createdJobs = [];
  for (const job of jobs) {
    const created = await prisma.job.upsert({
      where: { external_id: `demo-${job.company.toLowerCase().replace(/\s+/g, '-')}-${job.title.toLowerCase().replace(/\s+/g, '-')}` },
      update: {
        apply_url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${job.company} ${job.title}`)}&location=India`,
      },
      create: {
        external_id: `demo-${job.company.toLowerCase().replace(/\s+/g, '-')}-${job.title.toLowerCase().replace(/\s+/g, '-')}`,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        job_type: job.job_type,
        description: `We are looking for a talented ${job.title} to join our growing team at ${job.company}. You will work on cutting-edge products used by millions of users across India and globally.\n\nResponsibilities:\n- Design and implement scalable backend services\n- Collaborate with cross-functional teams\n- Write clean, well-tested code\n- Participate in code reviews and architecture discussions\n\nWhy ${job.company}?\n- Competitive compensation and equity\n- Flexible work arrangements\n- World-class engineering culture\n- Opportunity to make a real impact`,
        requirements: 'Requirements:\n- 2-5 years of software development experience\n- Proficiency in Node.js / React / Python\n- Experience with PostgreSQL or similar databases\n- Strong understanding of REST APIs\n- Experience with cloud platforms (AWS/GCP)\n- Good communication skills',
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        apply_url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${job.company} ${job.title}`)}&location=India`,
        posted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
    createdJobs.push({ job: created, score: job.score });
  }
  console.log(`✅ ${createdJobs.length} jobs created`);

  // ── 5. Job Matches ──────────────────────────────────────────
  const createdMatches = [];
  for (const { job, score } of createdJobs) {
    const skillsMatched = ['Node.js', 'React', 'PostgreSQL'].slice(0, Math.floor(Math.random() * 3) + 1);
    const skillsMissing = score < 80 ? ['Kubernetes', 'Go'] : [];

    const match = await prisma.jobMatch.upsert({
      where: { user_id_job_id_resume_id: { user_id: user.id, job_id: job.id, resume_id: resume.id } },
      update: {},
      create: {
        user_id: user.id,
        job_id: job.id,
        resume_id: resume.id,
        match_score: score,
        match_reasons: {
          skills_matched: skillsMatched,
          skills_missing: skillsMissing,
          experience_fit: score >= 80 ? 'good' : 'partial',
          role_alignment: score >= 75 ? 'strong' : 'weak',
          summary: `Strong match for ${job.title} role. Your Node.js and React expertise aligns well with the job requirements.`,
        },
        is_seen: Math.random() > 0.4,
        is_saved: Math.random() > 0.7,
      },
    });
    createdMatches.push(match);
  }
  console.log(`✅ ${createdMatches.length} job matches created`);

  // ── 6. Applications ─────────────────────────────────────────
  const applicationData = [
    { index: 0, status: 'APPLIED', method: 'AUTO', daysAgo: 1 },
    { index: 1, status: 'APPLIED', method: 'AUTO', daysAgo: 2 },
    { index: 2, status: 'APPLIED', method: 'MANUAL', daysAgo: 3 },
    { index: 4, status: 'INTERVIEW', method: 'AUTO', daysAgo: 5 },
    { index: 6, status: 'INTERVIEW', method: 'AUTO', daysAgo: 7 },
    { index: 8, status: 'OFFER', method: 'AUTO', daysAgo: 10 },
    { index: 10, status: 'REJECTED', method: 'AUTO', daysAgo: 8 },
    { index: 11, status: 'FAILED', method: 'AUTO', daysAgo: 1 },
  ];

  const createdApplications = [];
  for (const appData of applicationData) {
    const { job } = createdJobs[appData.index];
    const match = createdMatches[appData.index];
    const appliedAt = new Date(Date.now() - appData.daysAgo * 24 * 60 * 60 * 1000);

    const app = await prisma.application.create({
      data: {
        user_id: user.id,
        job_id: job.id,
        resume_id: resume.id,
        match_id: match.id,
        status: appData.status,
        applied_at: appliedAt,
        application_method: appData.method,
        cover_letter: appData.status !== 'FAILED' ? `Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} position at ${job.company}. With 3 years of experience building scalable applications using Node.js and React, I am confident I can contribute significantly to your team.\n\nMy experience at TechCorp, where I built APIs serving 100k+ users, directly aligns with the challenges at ${job.company}. I am particularly drawn to your engineering culture and the opportunity to work on impactful products.\n\nLooking forward to discussing how I can contribute.\n\nBest regards,\nAlex Kumar` : null,
        failure_reason: appData.status === 'FAILED' ? 'CAPTCHA detected — manual apply required' : null,
        notes: appData.status === 'INTERVIEW' ? 'Interview scheduled for next week. Prepare system design questions.' : null,
        follow_up_date: appData.status === 'APPLIED' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
      },
    });
    createdApplications.push(app);

    // Application logs
    const logs = [
      { event: 'Application created', metadata: { method: appData.method } },
      { event: 'Cover letter generated', metadata: { words: 120 } },
      { event: 'Browser launched', metadata: { browser: 'Chromium', headless: true } },
      { event: 'Navigated to job page', metadata: { url: job.apply_url } },
    ];

    if (appData.status === 'FAILED') {
      logs.push({ event: 'CAPTCHA detected', metadata: { type: 'reCAPTCHA v2', action: 'stopped' } });
    } else {
      logs.push(
        { event: 'Form fields detected', metadata: { count: 8 } },
        { event: 'Form filled successfully', metadata: { fieldsCompleted: 8 } },
        { event: 'Application submitted', metadata: { confirmationShown: true } },
      );
    }

    for (const log of logs) {
      await prisma.applicationLog.create({
        data: {
          application_id: app.id,
          event: log.event,
          metadata: log.metadata,
          created_at: new Date(appliedAt.getTime() + logs.indexOf(log) * 5000),
        },
      });
    }
  }
  console.log(`✅ ${createdApplications.length} applications with logs created`);

  // ── 7. Schedules ────────────────────────────────────────────
  await prisma.schedule.createMany({
    data: [
      {
        user_id: user.id,
        name: 'Morning Job Hunt',
        cron_expression: '0 9 * * *',
        max_applications: 5,
        is_active: true,
        next_run: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
      {
        user_id: user.id,
        name: 'Evening Remote Check',
        cron_expression: '0 18 * * 1-5',
        max_applications: 3,
        is_active: true,
        next_run: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ 2 schedules created');

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo credentials:');
  console.log('  Email:    demo@applyai.dev');
  console.log('  Password: demo123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
