// src/automation/browser.js
const { chromium } = require('playwright');
const logger = require('../utils/logger');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

/**
 * Launch a stealth Chromium browser for job automation
 */
async function launchBrowser(headless = true) {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  const browser = await chromium.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled', // Reduce bot detection
      '--disable-infobars',
      '--window-size=1280,800',
    ],
  });

  logger.debug('🌐 Browser launched (Chromium)');
  return browser;
}

/**
 * Create a new page with stealth settings
 */
async function createStealthPage(browser) {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1280, height: 800 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    // Disable webdriver detection
    extraHTTPHeaders: {
      'Accept-Language': 'en-IN,en-GB;q=0.9,en;q=0.8',
    },
  });

  // Remove webdriver flag
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en'] });
  });

  const page = await context.newPage();
  return page;
}

/**
 * Random human-like delay between actions
 */
async function humanDelay(min = 500, max = 2000) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise((r) => setTimeout(r, delay));
}

/**
 * Type text with human-like speed
 */
async function humanType(page, selector, text, delay = 80) {
  await page.click(selector);
  await humanDelay(200, 400);
  for (const char of text) {
    await page.type(selector, char, { delay: delay + Math.random() * 40 });
  }
}

module.exports = { launchBrowser, createStealthPage, humanDelay, humanType };
