// src/automation/captcha.js
const logger = require('../utils/logger');

/**
 * Detect presence of CAPTCHA challenges on a page
 * Returns true if CAPTCHA detected
 */
async function detectCaptcha(page) {
  try {
    const captchaIndicators = [
      // reCAPTCHA
      '[class*="recaptcha"]',
      '#recaptcha',
      '.g-recaptcha',
      'iframe[src*="recaptcha"]',
      'iframe[src*="google.com/recaptcha"]',

      // hCaptcha
      '.h-captcha',
      'iframe[src*="hcaptcha.com"]',

      // Cloudflare Turnstile
      '.cf-turnstile',
      'iframe[src*="challenges.cloudflare.com"]',

      // Generic CAPTCHA text
      // (checked via text content below)
    ];

    for (const selector of captchaIndicators) {
      const element = await page.$(selector);
      if (element) {
        logger.warn(`🚨 CAPTCHA detected: ${selector}`);
        return true;
      }
    }

    // Check page text for CAPTCHA keywords
    const content = await page.content();
    const captchaKeywords = ['captcha', 'robot', 'human verification', 'security check', 'prove you are human'];
    for (const keyword of captchaKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        logger.warn(`🚨 CAPTCHA keyword detected: "${keyword}"`);
        return true;
      }
    }

    return false;
  } catch (err) {
    logger.error('CAPTCHA detection error:', err.message);
    return false;
  }
}

/**
 * Check if a page has a login wall
 */
async function detectLoginWall(page) {
  const loginIndicators = [
    '[class*="login"]',
    '[class*="signin"]',
    'form[action*="login"]',
    'input[type="password"]',
  ];

  const url = page.url();
  if (url.includes('/login') || url.includes('/signin')) return true;

  for (const selector of loginIndicators) {
    const element = await page.$(selector);
    if (element) return true;
  }

  return false;
}

module.exports = { detectCaptcha, detectLoginWall };
