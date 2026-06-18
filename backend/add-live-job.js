const readline = require('readline');
const prisma = require('./src/db/prisma');
const logger = require('./src/utils/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question, defaultVal = '') {
  const hint = defaultVal ? ` (${defaultVal})` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${hint}: `, (ans) => {
      resolve(ans.trim() || defaultVal);
    });
  });
}

async function run() {
  console.log('\n💼 Add Live Job to database for Automation Testing 💼\n');

  try {
    const email = await ask('1. User Email to link', 'demo@applyai.dev');
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { resumes: { where: { is_active: true }, take: 1 } }
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found.`);
      process.exit(1);
    }

    const resume = user.resumes[0];
    if (!resume) {
      console.error(`❌ User has no active resume. Please upload a resume in the frontend first.`);
      process.exit(1);
    }

    console.log(`\nFound User: ${user.name}`);
    console.log(`Active Resume: ${resume.file_name}\n`);

    const title = await ask('2. Job Title', 'Software Engineer');
    const company = await ask('3. Company Name', 'Acme Corporation');
    const location = await ask('4. Location', 'Remote, India');
    const applyUrl = await ask('5. Live Job Apply URL (e.g. LinkedIn / Indeed / Generic)');
    
    if (!applyUrl.startsWith('http://') && !applyUrl.startsWith('https://')) {
      console.error('❌ Invalid URL. Must start with http:// or https://');
      process.exit(1);
    }

    // Determine Job Source based on URL
    let source = 'MANUAL';
    if (applyUrl.includes('linkedin.com')) source = 'LINKEDIN';
    
    // Create external_id from timestamp to keep it unique
    const externalId = `live-${Date.now()}`;

    console.log('\nCreating Job record...');
    const job = await prisma.job.create({
      data: {
        external_id: externalId,
        source: source,
        title: title,
        company: company,
        location: location,
        description: 'Live test job description for automation testing.',
        apply_url: applyUrl,
        job_type: 'REMOTE'
      }
    });

    console.log('Creating Job Match details...');
    await prisma.jobMatch.create({
      data: {
        user_id: user.id,
        job_id: job.id,
        resume_id: resume.id,
        match_score: 95,
        match_reasons: {
          match_score: 95,
          skills_matched: ['JavaScript', 'Node.js', 'React'],
          skills_missing: [],
          experience_fit: 'Perfect fit for role',
          role_alignment: 'Highly aligned with target preferences',
          summary: 'Highly recommended live job for verification.'
        }
      }
    });

    console.log('\n🟢 Success! Live job added successfully.');
    console.log('----------------------------------------------------');
    console.log(`Job Title:  ${job.title}`);
    console.log(`Company:    ${job.company}`);
    console.log(`Source:     ${job.source}`);
    console.log('----------------------------------------------------');
    console.log('👉 Next Steps:');
    console.log('1. Open http://localhost:3001 and log in as demo@applyai.dev / demo123');
    console.log('2. Click on the "Explore" or "Saved" tab.');
    console.log('3. You will see this job in the list. Click on it.');
    console.log('4. Click the "Apply Now" button to watch the Playwright browser execute the automation!');

  } catch (err) {
    console.error('❌ Error creating live job:', err.message);
  } finally {
    rl.close();
  }
}

run();
