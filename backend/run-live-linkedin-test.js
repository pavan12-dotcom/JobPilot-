const { launchBrowser, createStealthPage, humanDelay } = require('./src/automation/browser');
const { applyOnLinkedIn } = require('./src/automation/sites/linkedin');
const prisma = require('./src/db/prisma');

async function run() {
  console.log('\n🚀 Starting Live LinkedIn Auto-Apply Verification 🚀\n');

  // 1. Get user details from database
  const user = await prisma.user.findUnique({
    where: { email: 'demo@applyai.dev' },
    include: { resumes: { where: { is_active: true }, take: 1 } }
  });

  if (!user || !user.resumes[0]) {
    console.error('❌ Demo user or active resume not found in the database. Please seed the database first.');
    process.exit(1);
  }

  const resumeData = user.resumes[0].parsed_data;
  console.log(`Candidate Name: ${resumeData.name}`);
  console.log(`Skills:         ${resumeData.skills.slice(0, 5).join(', ')}`);
  console.log(`Phone:          ${resumeData.phone || '+91 9876543210'}`);

  // 2. Select a target LinkedIn Job URL
  const jobUrl = 'https://www.linkedin.com/jobs/view/4426956543'; // Swiggy - SDE III
  console.log(`\nNavigating to:  ${jobUrl}`);

  let browser;
  try {
    // 3. Launch browser in visible windowed mode
    browser = await launchBrowser(false);
    const page = await createStealthPage(browser);
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // 4. Interactive Login Wall Detection
    console.log('Checking for LinkedIn Login Wall...');
    const isLoginWall = await page.evaluate(() => {
      return document.querySelector('.authwall') || 
             document.querySelector('form.login__form') ||
             document.location.href.includes('login') ||
             !document.querySelector('button.jobs-apply-button, [aria-label*="Easy Apply"]');
    });

    if (isLoginWall) {
      console.log('\n🔒 LinkedIn Login required.');
      console.log('👉 ACTION REQUIRED: Please log in to your LinkedIn account in the browser window now.');
      console.log('Waiting for login (timeout: 60s)...');

      // Poll until the Easy Apply button or jobs-apply-button becomes visible
      let loggedIn = false;
      for (let i = 0; i < 60; i++) {
        await humanDelay(1000, 1000);
        try {
          const currentUrl = page.url();
          if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork') || currentUrl.includes('/in/')) {
            console.log('Redirect detected. Navigating back to job listing...');
            await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          }

          const hasApplyBtn = await page.$('button.jobs-apply-button, [aria-label*="Easy Apply"]');
          if (hasApplyBtn) {
            loggedIn = true;
            console.log('\n🔓 Login detected! Proceeding with auto-apply...');
            break;
          }
        } catch (e) {
          // Ignore navigation errors during active redirects
        }
      }

      if (!loggedIn) {
        throw new Error('Login timeout. Please try running the script again once you are ready.');
      }
    }

    // 5. Execute Auto-Apply
    console.log('Triggering apply script...');
    const result = await applyOnLinkedIn(page, {
      resumeData,
      coverLetter: 'Dear hiring manager, I am very excited to apply for this role. I have over 3 years of software engineering experience focusing on building APIs with Node.js and React.',
      onLog: (msg) => console.log(`  🤖 [Playwright Log] ${msg}`)
    });

    if (result.success) {
      console.log('\n🟢 Live Test Finished Successfully!');
      console.log(`Method: ${result.method}`);
    } else {
      console.log(`\n🔴 Application stopped: ${result.error}`);
    }

  } catch (err) {
    console.error('\n💥 Test run failed:', err.message);
  } finally {
    console.log('\nKeeping the browser open for 10 seconds so you can see the result...');
    await humanDelay(10000, 10000);
    if (browser) {
      await browser.close().catch(() => {});
    }
    process.exit(0);
  }
}

run();
