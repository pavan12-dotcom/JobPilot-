// src/automation/sites/linkedin.js
const { humanDelay, humanType } = require('../browser');
const { detectCaptcha } = require('../captcha');
const logger = require('../../utils/logger');

/**
 * Apply to a job via LinkedIn Easy Apply
 */
async function applyOnLinkedIn(page, { resumeData, coverLetter, onLog }) {
  const log = onLog || (() => {});

  try {
    await log('LinkedIn: Looking for Easy Apply button');

    // Find Easy Apply button
    const easyApplyBtn = await page.$('button.jobs-apply-button, [aria-label*="Easy Apply"]');
    if (!easyApplyBtn) {
      return { success: false, error: 'Easy Apply button not found' };
    }

    await humanDelay(500, 1000);
    await easyApplyBtn.click();
    await log('LinkedIn: Clicked Easy Apply');

    // Wait for modal
    await page.waitForSelector('.jobs-easy-apply-modal', { timeout: 10000 });
    await humanDelay(1000, 2000);

    // Process multi-step form
    let step = 0;
    const maxSteps = 8;

    while (step < maxSteps) {
      // Check for CAPTCHA
      const hasCaptcha = await detectCaptcha(page);
      if (hasCaptcha) return { success: false, error: 'CAPTCHA detected mid-apply' };

      // Fill contact info if present
      await fillLinkedInField(page, 'input[id*="phoneNumber"], input[name*="phone"]', resumeData.phone || '');
      await fillLinkedInField(page, 'input[id*="city"], input[name*="location"]', 'Bangalore');

      // Fill work experience fields
      const yoeField = await page.$('input[id*="years"], input[id*="experience"]');
      if (yoeField && await yoeField.isVisible()) {
        await yoeField.fill(String(resumeData.total_experience_years || 3));
      }

      // Paste cover letter if field exists
      const coverLetterField = await page.$('textarea[id*="cover"], textarea[name*="cover"]');
      if (coverLetterField && coverLetter && await coverLetterField.isVisible()) {
        await coverLetterField.click();
        await humanDelay(200, 500);
        await coverLetterField.fill(coverLetter);
        await log('LinkedIn: Cover letter filled');
      }

      // Check for "Next" button (multi-step)
      const nextBtn = await page.$('button[aria-label="Continue to next step"], button[aria-label="Next"]');
      const reviewBtn = await page.$('button[aria-label="Review your application"]');
      const submitBtn = await page.$('button[aria-label="Submit application"]');

      if (submitBtn && await submitBtn.isVisible()) {
        await humanDelay(1000, 2000);
        await submitBtn.click();
        await humanDelay(2000, 3000);
        await log('LinkedIn: Application submitted!');

        // Check for confirmation
        const confirmation = await page.$('.artdeco-inline-feedback--success, .jobs-post-apply-feedback');
        return { success: true, method: 'linkedin-easy-apply', hasConfirmation: !!confirmation };
      } else if (reviewBtn && await reviewBtn.isVisible()) {
        await reviewBtn.click();
        await humanDelay(1000, 1500);
      } else if (nextBtn && await nextBtn.isVisible()) {
        await nextBtn.click();
        await humanDelay(1000, 2000);
        step++;
      } else {
        // No more buttons — might be done or stuck
        break;
      }
    }

    // Already applied check
    const alreadyApplied = await page.$('[aria-label*="Applied"]');
    if (alreadyApplied) {
      return { success: true, method: 'linkedin-already-applied' };
    }

    return { success: false, error: 'Could not complete LinkedIn application' };
  } catch (err) {
    logger.error('LinkedIn apply error:', err.message);
    return { success: false, error: err.message };
  }
}

async function fillLinkedInField(page, selector, value) {
  if (!value) return;
  const field = await page.$(selector);
  if (field && await field.isVisible()) {
    await field.click();
    await humanDelay(100, 300);
    await field.fill(value);
  }
}

module.exports = { applyOnLinkedIn };
