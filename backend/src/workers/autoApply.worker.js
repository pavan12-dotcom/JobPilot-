// src/workers/autoApply.worker.js
const prisma = require('../db/prisma');
const applicationService = require('../services/application.service');
const { generateCoverLetter } = require('../ai/coverLetter');
const { sendApplied, sendCaptchaAlert } = require('../services/notification.service');
const { launchBrowser } = require('../automation/browser');
const { detectSiteAndApply } = require('../automation/sites/generic');
const { detectCaptcha } = require('../automation/captcha');
const logger = require('../utils/logger');

/**
 * Full auto-apply pipeline:
 * 1. Load application + job + resume data
 * 2. Generate cover letter
 * 3. Launch Playwright
 * 4. Navigate to job URL
 * 5. Detect site + apply
 * 6. Log all steps
 * 7. Update status
 */
async function processAutoApply(job) {
  const { applicationId } = job.data;
  let browser = null;

  try {
    // Load application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        resume: true,
        user: true,
        match: true,
      },
    });

    if (!application) throw new Error('Application not found');
    if (application.status === 'APPLIED') return { skipped: true };

    const { job: jobRecord, resume, user, match } = application;

    logger.info(`🤖 Auto-applying to ${jobRecord.title} at ${jobRecord.company}`);

    // Update status: APPLYING
    await applicationService.updateStatus(applicationId, user.id, 'APPLYING');
    await applicationService.logEvent(applicationId, 'Auto-apply started', {
      job: jobRecord.title,
      company: jobRecord.company,
    });

    // Generate cover letter
    let coverLetter = null;
    try {
      coverLetter = await generateCoverLetter(
        resume.parsed_data,
        jobRecord,
        match?.match_reasons,
      );
      await applicationService.logEvent(applicationId, 'Cover letter generated', {
        words: coverLetter.split(' ').length,
      });
    } catch (err) {
      logger.warn('Cover letter generation failed:', err.message);
    }

    // Update cover letter in DB
    if (coverLetter) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { cover_letter: coverLetter },
      });
    }

    // Launch browser
    await applicationService.logEvent(applicationId, 'Browser launched', {
      browser: 'Chromium',
      headless: true,
    });

    browser = await launchBrowser();
    const page = await browser.newPage();

    // Navigate to job page
    await applicationService.logEvent(applicationId, 'Navigating to job page', {
      url: jobRecord.apply_url,
    });

    await page.goto(jobRecord.apply_url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Check for CAPTCHA immediately
    const hasCaptcha = await detectCaptcha(page);
    if (hasCaptcha) {
      await applicationService.logEvent(applicationId, 'CAPTCHA detected', {
        type: 'reCAPTCHA/hCaptcha',
        action: 'stopped',
      });

      await applicationService.updateStatus(applicationId, user.id, 'FAILED', {
        failure_reason: 'CAPTCHA detected — manual apply required',
      });

      // Take screenshot
      const screenshotBuffer = await page.screenshot();
      // In production, upload screenshot to Supabase Storage
      // For now, just log it

      // Alert user
      await sendCaptchaAlert(user.email, user.name, jobRecord);

      return { success: false, reason: 'CAPTCHA' };
    }

    // Detect site and apply
    const applyResult = await detectSiteAndApply(page, {
      jobData: jobRecord,
      resumeData: resume.parsed_data,
      coverLetter,
      onLog: (event, meta) => applicationService.logEvent(applicationId, event, meta),
    });

    // Take final screenshot
    try {
      await page.screenshot({ path: `/tmp/screenshot_${applicationId}.png` });
    } catch {}

    if (applyResult.success) {
      await applicationService.updateStatus(applicationId, user.id, 'APPLIED', {
        screenshot_url: applyResult.screenshotUrl,
      });

      await applicationService.logEvent(applicationId, 'Application submitted successfully', {
        method: applyResult.method,
      });

      // Send success email
      await sendApplied(user.email, user.name, jobRecord);

      logger.info(`✅ Successfully applied to ${jobRecord.title} at ${jobRecord.company}`);
      return { success: true, applicationId };
    } else {
      throw new Error(applyResult.error || 'Apply failed');
    }
  } catch (err) {
    logger.error(`Auto-apply failed for ${applicationId}:`, err.message);

    try {
      await applicationService.updateStatus(applicationId, 'system', 'FAILED', {
        failure_reason: err.message,
      });

      await applicationService.logEvent(applicationId, 'Auto-apply failed', {
        error: err.message,
      });
    } catch {}

    throw err;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

function registerAutoApplyWorker(queue) {
  queue.process('apply', 2, processAutoApply); // Max 2 concurrent browsers
  logger.info('👷 Auto-apply worker registered (2 concurrent)');
}

module.exports = { processAutoApply, registerAutoApplyWorker };
