// src/automation/sites/naukri.js
const { humanDelay } = require('../browser');
const { detectCaptcha, detectLoginWall } = require('../captcha');
const logger = require('../../utils/logger');

/**
 * Apply to a job on Naukri
 */
async function applyOnNaukri(page, { resumeData, onLog }) {
  const log = onLog || (() => {});

  try {
    await log('Naukri: Looking for Apply button');

    // Check for login wall first
    const hasLoginWall = await detectLoginWall(page);
    if (hasLoginWall) {
      return { success: false, error: 'Login required — cannot auto-apply on Naukri without credentials' };
    }

    const applyBtn = await page.$('button.apply-btn, a#apply-button, button[class*="apply"]');
    if (!applyBtn) {
      return { success: false, error: 'Apply button not found on Naukri' };
    }

    await humanDelay(500, 1000);
    await applyBtn.click();
    await log('Naukri: Clicked Apply');

    await humanDelay(2000, 3000);

    const hasCaptcha = await detectCaptcha(page);
    if (hasCaptcha) return { success: false, error: 'CAPTCHA detected' };

    // Check again for login redirect
    const loginRedirect = await detectLoginWall(page);
    if (loginRedirect) {
      return { success: false, error: 'Redirected to login — manual apply required' };
    }

    // Try quick apply form
    const submitBtn = await page.$('button[type="submit"], button.btn-apply');
    if (submitBtn) {
      await humanDelay(1000, 2000);
      await submitBtn.click();
      await humanDelay(2000, 3000);
      await log('Naukri: Application submitted');
      return { success: true, method: 'naukri-quick-apply' };
    }

    return { success: false, error: 'Could not complete Naukri application' };
  } catch (err) {
    logger.error('Naukri apply error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { applyOnNaukri };
