// src/automation/test/automation.test.js
const { createMockServer } = require('./mockServer');
const { launchBrowser, createStealthPage } = require('../browser');
const { detectCaptcha, detectLoginWall } = require('../captcha');
const { applyOnLinkedIn } = require('../sites/linkedin');
const { applyOnIndeed } = require('../sites/indeed');
const { applyOnNaukri } = require('../sites/naukri');
const { applyGeneric } = require('../sites/generic');

const PORT = 3999;
const HOST = `http://localhost:${PORT}`;

// Dummy resume data for test
const dummyResume = {
  name: 'Alex Kumar',
  email: 'alex.kumar@example.com',
  phone: '+91 98765 43210',
  total_experience_years: 4,
  current_role: 'Software Engineer',
  skills: ['JavaScript', 'Node.js', 'React', 'Playwright'],
  summary: 'Detail-oriented Software Engineer with 4 years of experience.',
};

async function runTests() {
  console.log('🚀 Starting Automation Integration Tests...');
  const app = createMockServer();
  
  // Start server
  const server = app.listen(PORT, async () => {
    console.log(`📡 Mock server listening on port ${PORT}`);
    
    let browser;
    let page;
    let failed = false;

    try {
      // Launch stealth browser
      browser = await launchBrowser(true); // Run headless
      page = await createStealthPage(browser);

      // Helper function to assert condition
      const assert = (condition, message) => {
        if (!condition) {
          console.error(`❌ FAILED: ${message}`);
          failed = true;
        } else {
          console.log(`✅ PASSED: ${message}`);
        }
      };

      // ─── Test 1: CAPTCHA Detection ───────────────────
      console.log('\n--- Test 1: CAPTCHA Detection ---');
      await page.goto(`${HOST}/captcha`);
      const captchaDetected = await detectCaptcha(page);
      assert(captchaDetected === true, 'CAPTCHA should be detected');

      // ─── Test 2: Login Wall Detection ────────────────
      console.log('\n--- Test 2: Login Wall Detection ---');
      await page.goto(`${HOST}/login-wall`);
      const loginWallDetected = await detectLoginWall(page);
      assert(loginWallDetected === true, 'Login Wall should be detected');

      // ─── Test 3: LinkedIn Easy Apply ──────────────────
      console.log('\n--- Test 3: LinkedIn Easy Apply ---');
      await page.goto(`${HOST}/linkedin`);
      const linkedinRes = await applyOnLinkedIn(page, {
        resumeData: dummyResume,
        coverLetter: 'Dear hiring team, I am excited to apply.',
        onLog: (msg) => console.log(`  [LinkedIn Log] ${msg}`),
      });
      assert(linkedinRes.success === true, 'LinkedIn Easy Apply should succeed');
      assert(linkedinRes.method === 'linkedin-easy-apply', 'LinkedIn method matches');

      // ─── Test 4: Indeed Flow ─────────────────────────
      console.log('\n--- Test 4: Indeed Flow ---');
      await page.goto(`${HOST}/indeed`);
      const indeedRes = await applyOnIndeed(page, {
        resumeData: dummyResume,
        coverLetter: 'Dear indeed team...',
        onLog: (msg) => console.log(`  [Indeed Log] ${msg}`),
      });
      assert(indeedRes.success === true, 'Indeed apply should succeed');
      assert(indeedRes.method === 'indeed', 'Indeed method matches');

      // ─── Test 5: Naukri Flow ─────────────────────────
      console.log('\n--- Test 5: Naukri Flow ---');
      await page.goto(`${HOST}/naukri`);
      const naukriRes = await applyOnNaukri(page, {
        resumeData: dummyResume,
        onLog: (msg) => console.log(`  [Naukri Log] ${msg}`),
      });
      assert(naukriRes.success === true, 'Naukri apply should succeed');
      assert(naukriRes.method === 'naukri-quick-apply', 'Naukri method matches');

      // ─── Test 6: Generic Flow ────────────────────────
      console.log('\n--- Test 6: Generic Flow ---');
      await page.goto(`${HOST}/generic`);
      const genericRes = await applyGeneric(page, {
        resumeData: dummyResume,
        coverLetter: 'Dear generic recruiter...',
        jobData: { title: 'Software Engineer', company: 'Acme Corp' },
        onLog: (msg) => console.log(`  [Generic Log] ${msg}`),
      });
      assert(genericRes.success === true, 'Generic apply should succeed');
      assert(genericRes.method === 'generic', 'Generic method matches');

    } catch (err) {
      console.error('💥 Unexpected test execution error:', err);
      failed = true;
    } finally {
      if (browser) {
        await browser.close();
      }
      server.close(() => {
        console.log('\n🏁 Mock server stopped.');
        if (failed) {
          console.log('🔴 Some tests failed. Check logs above.');
          process.exit(1);
        } else {
          console.log('🟢 All integration tests passed successfully!');
          process.exit(0);
        }
      });
    }
  });
}

runTests();
