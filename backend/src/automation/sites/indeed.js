// src/automation/sites/indeed.js
const { humanDelay } = require('../browser');
const { detectCaptcha } = require('../captcha');
const { fillFormFields } = require('../../ai/formFiller');
const logger = require('../../utils/logger');

/**
 * Apply to a job on Indeed
 */
async function applyOnIndeed(page, { resumeData, coverLetter, onLog }) {
  const log = onLog || (() => {});

  try {
    await log('Indeed: Looking for Apply button');

    const applyBtn = await page.$('button#indeedApplyButton, a[class*="indeed-apply"], button[class*="ia-IndeedApplyButton"]');
    if (!applyBtn) {
      return { success: false, error: 'Indeed Apply button not found' };
    }

    await humanDelay(500, 1000);
    await applyBtn.click();
    await log('Indeed: Clicked Apply Now');

    // Wait for form
    await page.waitForLoadState('domcontentloaded');
    await humanDelay(2000, 3000);

    const hasCaptcha = await detectCaptcha(page);
    if (hasCaptcha) return { success: false, error: 'CAPTCHA detected' };

    // Fill standard fields
    await fillField(page, 'input[name="applicant.name"], #input-applicant\\.name', resumeData.name);
    await fillField(page, 'input[name="applicant.email"], input[type="email"]', resumeData.email);
    await fillField(page, 'input[name="applicant.phoneNumber"], input[type="tel"]', resumeData.phone);

    await log('Indeed: Basic fields filled');

    // Scan for screening questions
    const questionLabels = await page.$$eval(
      'label, .ia-Questions-item-label',
      (els) => els.map((el) => el.textContent?.trim()).filter(Boolean),
    );

    if (questionLabels.length > 0) {
      await log('Indeed: Answering screening questions', { count: questionLabels.length });
      const answers = await fillFormFields(questionLabels, resumeData);

      for (const [label, answer] of Object.entries(answers)) {
        if (!answer) continue;
        // Find input with this label and fill it
        const inputs = await page.$$(`input, textarea, select`);
        for (const input of inputs) {
          const nearbyLabel = await input.evaluate((el) => {
            const label = el.labels?.[0]?.textContent || el.placeholder || '';
            return label.trim();
          });
          if (nearbyLabel && nearbyLabel.toLowerCase().includes(label.toLowerCase().substring(0, 20))) {
            await input.fill(String(answer));
            await humanDelay(100, 300);
            break;
          }
        }
      }
    }

    // Submit
    const submitBtn = await page.$('button[class*="ia-continueButton"], button[type="submit"]');
    if (submitBtn) {
      await humanDelay(1000, 2000);
      await submitBtn.click();
      await humanDelay(2000, 3000);
      await log('Indeed: Application submitted');
      return { success: true, method: 'indeed' };
    }

    return { success: false, error: 'Submit button not found' };
  } catch (err) {
    logger.error('Indeed apply error:', err.message);
    return { success: false, error: err.message };
  }
}

async function fillField(page, selector, value) {
  if (!value) return;
  const field = await page.$(selector);
  if (field) {
    await field.click();
    await humanDelay(100, 300);
    await field.fill(value);
  }
}

module.exports = { applyOnIndeed };
