// src/automation/sites/generic.js
const { humanDelay } = require('../browser');
const { detectCaptcha, detectLoginWall } = require('../captcha');
const { fillFormFields } = require('../../ai/formFiller');
const { applyOnLinkedIn } = require('./linkedin');
const { applyOnIndeed } = require('./indeed');
const { applyOnNaukri } = require('./naukri');
const logger = require('../../utils/logger');

/**
 * Detect which job site we're on and use the appropriate handler
 */
async function detectSiteAndApply(page, options) {
  const url = page.url();
  const { onLog } = options;
  const log = onLog || (() => {});

  logger.debug(`Detecting site for: ${url}`);
  await log('Detecting job site', { url });

  // Site-specific handlers
  if (url.includes('linkedin.com')) {
    return applyOnLinkedIn(page, options);
  }

  if (url.includes('indeed.com') || url.includes('indeed.co')) {
    return applyOnIndeed(page, options);
  }

  if (url.includes('naukri.com')) {
    return applyOnNaukri(page, options);
  }

  // Fall through to generic handler
  return applyGeneric(page, options);
}

/**
 * Generic form filler for unknown job sites
 * Scans DOM for form fields and uses Claude to fill them
 */
async function applyGeneric(page, { resumeData, coverLetter, jobData, onLog }) {
  const log = onLog || (() => {});

  try {
    await log('Generic: Scanning page for application form');

    // Check for CAPTCHA
    const hasCaptcha = await detectCaptcha(page);
    if (hasCaptcha) return { success: false, error: 'CAPTCHA detected' };

    // Check for login wall
    const hasLogin = await detectLoginWall(page);
    if (hasLogin) return { success: false, error: 'Login required' };

    // Find apply button if on job listing page
    const applyButton = await findApplyButton(page);
    if (applyButton) {
      await applyButton.click();
      await humanDelay(2000, 3000);
      await log('Generic: Clicked apply button');
    }

    // Scan all visible form fields
    const formFields = await page.$$eval(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
      (inputs) => inputs.map((el) => {
        const label = el.labels?.[0]?.textContent?.trim() ||
          el.placeholder?.trim() ||
          el.name?.replace(/[_-]/g, ' ') ||
          el.id?.replace(/[_-]/g, ' ') ||
          '';
        return { label, type: el.type || el.tagName.toLowerCase(), name: el.name, id: el.id };
      }).filter((f) => f.label.length > 0),
    );

    if (formFields.length === 0) {
      return { success: false, error: 'No form fields found on page' };
    }

    await log('Generic: Fields detected', { count: formFields.length });

    // Use Claude to fill fields
    const fieldLabels = formFields.map((f) => f.label);
    const answers = await fillFormFields(fieldLabels, resumeData, jobData);

    // Fill each field
    let filled = 0;
    for (let i = 0; i < formFields.length; i++) {
      const field = formFields[i];
      const answer = answers[field.label];
      if (!answer) continue;

      try {
        const selector = field.id
          ? `#${field.id}`
          : field.name
          ? `[name="${field.name}"]`
          : null;

        if (!selector) continue;

        const el = await page.$(selector);
        if (!el) continue;

        if (field.type === 'select') {
          await el.selectOption({ label: answer });
        } else {
          await el.fill(String(answer));
        }

        await humanDelay(100, 300);
        filled++;
      } catch {}
    }

    await log('Generic: Fields filled', { filled, total: formFields.length });

    // Find and click submit
    const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply"), button:has-text("Send Application")');

    if (!submitBtn) {
      return { success: false, error: 'Submit button not found' };
    }

    const prevUrl = page.url();
    await humanDelay(1000, 2000);
    await submitBtn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await humanDelay(2000, 3000);

    // Check for success: URL changed or success message
    const newUrl = page.url();
    const pageContent = await page.content();
    const successIndicators = ['thank you', 'application submitted', 'successfully applied', 'received your application'];
    const isSuccess = newUrl !== prevUrl || successIndicators.some((s) => pageContent.toLowerCase().includes(s));

    if (isSuccess) {
      await log('Generic: Application submitted successfully');
      return { success: true, method: 'generic' };
    }

    return { success: false, error: 'Could not verify application submission' };
  } catch (err) {
    logger.error('Generic apply error:', err.message);
    return { success: false, error: err.message };
  }
}

async function findApplyButton(page) {
  const selectors = [
    'button:has-text("Apply Now")',
    'button:has-text("Apply")',
    'a:has-text("Apply Now")',
    'a:has-text("Apply")',
    '[class*="apply-button"]',
    '[id*="apply-btn"]',
  ];

  for (const selector of selectors) {
    const btn = await page.$(selector);
    if (btn) return btn;
  }

  return null;
}

module.exports = { detectSiteAndApply, applyGeneric };
