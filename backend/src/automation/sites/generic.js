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
 * Scroll down the page slowly to trigger lazy loading of elements and bring them into view
 */
async function scrollPage(page, log) {
  try {
    await log('Generic: Scrolling page to load all elements');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 150;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight > 4000) {
            clearInterval(timer);
            resolve();
          }
        }, 80);
      });
    });
    await humanDelay(1500, 2500);
    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await humanDelay(1000, 1500);
  } catch (err) {
    logger.warn('Failed to scroll page:', err.message);
  }
}

/**
 * Scroll down the page step-by-step and click the apply option when found
 */
async function scrollAndClickApply(page, log) {
  const applyTexts = [
    'Apply Now',
    'Apply',
    'easy apply',
    'Submit Application',
    'View Job',
    'View Jobs'
  ];

  // 1. Scroll down the page first to load all lazy content
  await log('Generic: Scrolling page down to trigger lazy loading...');
  for (let i = 0; i < 6; i++) {
    try {
      await page.evaluate(() => window.scrollBy(0, 400));
      await humanDelay(300, 500);
    } catch {}
  }

  // Diagnostic logging of all visible links/buttons
  try {
    const allBtns = await page.$$eval('a, button', (elements) => {
      return elements.map(el => {
        const style = window.getComputedStyle(el);
        const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        if (!isVisible) return null;
        return {
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim() || el.value || '',
        };
      }).filter(b => b !== null && b.text.length > 0);
    });
    await log(`Generic Diagnostic: All visible links/buttons: ${JSON.stringify(allBtns)}`);
  } catch (err) {
    logger.warn('Failed to run diagnostic:', err.message);
  }

  // 2. Scan and click the best matching element
  for (const text of applyTexts) {
    try {
      const locator = page.locator(`text=/${text}/i`);
      const count = await locator.count();
      for (let idx = 0; idx < count; idx++) {
        const el = locator.nth(idx);
        if (await el.isVisible()) {
          const content = (await el.textContent()) || '';
          if (content.toLowerCase().includes('filter')) continue; // skip filters
          
          await el.scrollIntoViewIfNeeded();
          const elMeta = await el.evaluate(e => ({ tag: e.tagName.toLowerCase(), id: e.id, cls: e.className }));
          await el.click();
          await log(`Generic: Clicked Apply element with text content: "${content.trim()}" (tag: ${elMeta.tag}, id: ${elMeta.id}, class: ${elMeta.cls})`);
          return true;
        }
      }
    } catch {}
  }

  // 3. If still not found, try scrolling further down and scanning again
  await log('Generic: Scrolling further down step-by-step to search...');
  for (let i = 0; i < 8; i++) {
    try {
      await page.evaluate(() => window.scrollBy(0, 400));
      await humanDelay(500, 800);

      for (const text of applyTexts) {
        const locator = page.locator(`text=/${text}/i`);
        const count = await locator.count();
        for (let idx = 0; idx < count; idx++) {
          const el = locator.nth(idx);
          if (await el.isVisible()) {
            const content = (await el.textContent()) || '';
            if (content.toLowerCase().includes('filter')) continue; // skip filters

            await el.scrollIntoViewIfNeeded();
            const elMeta = await el.evaluate(e => ({ tag: e.tagName.toLowerCase(), id: e.id, cls: e.className }));
            await el.click();
            await log(`Generic: Clicked Apply element with text content: "${content.trim()}" after deep scrolling (tag: ${elMeta.tag}, id: ${elMeta.id}, class: ${elMeta.cls})`);
            return true;
          }
        }
      }
    } catch (e) {
      logger.warn('Error during scroll-and-find:', e.message);
    }
  }

  // Fallback: look for a button containing "Apply" or "View" in a case-insensitive way
  try {
    const anyBtn = await page.locator('button, a').evaluateAll((elements) => {
      const target = elements.find(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('apply now') || text.includes('easy apply') || (text.includes('apply') && !text.includes('apply filter')) || text.includes('view jobs') || text.includes('view job');
      });
      return target ? { selector: `${target.tagName.toLowerCase()}:has-text("${target.textContent.trim()}")` } : null;
    });
    if (anyBtn && anyBtn.selector) {
      const btn = await page.$(anyBtn.selector);
      if (btn && await btn.isVisible()) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        await log(`Generic: Clicked fallback Apply button: ${anyBtn.selector}`);
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Generic form filler for unknown job sites
 * Scans DOM for form fields and uses Gemini to fill them
 */
async function applyGeneric(page, { resumeData, coverLetter, jobData, localResumePath, onLog }) {
  const log = onLog || (() => {});

  try {
    await log(`Generic: Scanning page for application form at ${page.url()}`);

    // Swap target context to frame if there's an embedded careers frame
    let targetPage = page;
    const embeddedFrame = page.frames().find(f => {
      const name = f.name() || '';
      const url = f.url() || '';
      return name === 'mnhembedded' || 
             url.includes('mynexthire.com') || 
             url.includes('darwinbox') || 
             url.includes('phenom');
    });
    if (embeddedFrame) {
      targetPage = embeddedFrame;
      await log(`Generic: Embedded frame detected (${embeddedFrame.url()}). Swapping automation context to frame.`);
    }

    // Check for CAPTCHA
    const hasCaptcha = await detectCaptcha(targetPage);
    if (hasCaptcha) return { success: false, error: 'CAPTCHA detected' };

    // Check for login wall
    const hasLogin = await detectLoginWall(targetPage);
    if (hasLogin) return { success: false, error: 'Login required' };

    // 1. First Click: Click "View Jobs" / "Apply" on the listing page
    const clickedFirst = await scrollAndClickApply(targetPage, log);
    if (clickedFirst) {
      await humanDelay(4000, 6000); // Wait for redirect / details to load

      // Re-detect active frame after redirection/details load in case it was loaded dynamically
      const activeFrame = page.frames().find(f => {
        const name = f.name() || '';
        const url = f.url() || '';
        return name === 'mnhembedded' || 
               url.includes('mynexthire.com') || 
               url.includes('darwinbox') || 
               url.includes('phenom');
      });
      if (activeFrame) {
        targetPage = activeFrame;
        await log(`Generic: Updated frame context after transition (${targetPage.url()})`);
      }

      // 2. Second Click: Click "Apply" on the details page if necessary
      const hasForm = await targetPage.evaluate(() => {
        const form = document.querySelector('form');
        if (!form) return false;
        const style = window.getComputedStyle(form);
        return form.offsetWidth > 0 && form.offsetHeight > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      });

      if (!hasForm) {
        await scrollAndClickApply(targetPage, log);
        await humanDelay(4000, 6000); // Wait for the form modal or page to load
      } else {
        await log('Generic: Form already visible on page, skipping second click step.');
      }
    }

    // Scroll page down and back up to trigger form inputs hydration
    await scrollPage(targetPage, log);

    let step = 0;
    const maxSteps = 6;
    let submitted = false;

    while (step < maxSteps) {
      // Check CAPTCHA at each step
      if (await detectCaptcha(targetPage)) {
        return { success: false, error: 'CAPTCHA detected' };
      }

      // Scan all visible form fields on current screen
      const formFields = await targetPage.$$eval(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
        (inputs) => inputs.map((el) => {
          const style = window.getComputedStyle(el);
          const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          if (!isVisible) return null;

          const labelText = el.labels?.[0]?.textContent?.trim() || el.placeholder?.trim() || '';
          const nameText = el.name?.replace(/[_-]/g, ' ') || el.id?.replace(/[_-]/g, ' ') || '';
          const label = labelText || nameText || '';
          const required = el.required || el.hasAttribute('required') || el.getAttribute('aria-required') === 'true' || labelText.includes('*') || labelText.toLowerCase().includes('required');
          return { label, type: el.type || el.tagName.toLowerCase(), name: el.name, id: el.id, required };
        }).filter((f) => f !== null && f.label.length > 0)
      );

      if (formFields.length > 0) {
        await log(`Generic: Step ${step + 1} - Fields detected`, { count: formFields.length });

        // Use Gemini to fill non-file fields
        const textFields = formFields.filter((f) => f.type !== 'file');
        const fieldLabels = textFields.map((f) => f.label);
        let answers = {};
        if (fieldLabels.length > 0) {
          answers = await fillFormFields(fieldLabels, resumeData, jobData);
        }

        // Fill each field on current page
        let filled = 0;
        for (const field of formFields) {
          try {
            const selector = field.id
              ? `#${field.id}`
              : field.name
              ? `[name="${field.name}"]`
              : null;

            if (!selector) continue;

            const el = await targetPage.$(selector);
            if (!el || !(await el.isVisible())) continue;

            if (field.type === 'file') {
              if (localResumePath) {
                await el.setInputFiles(localResumePath);
                await log(`Generic: Uploaded resume to field: "${field.label}"`);
                await humanDelay(1500, 2500);
                filled++;
              } else if (field.required) {
                throw new Error(`Needs Review: Required file field "${field.label}" is missing local resume`);
              }
              continue;
            }

            const answer = answers[field.label];
            if (!answer) {
              if (field.required) {
                throw new Error(`Needs Review: Required field "${field.label}" is missing`);
              }
              continue;
            }

            if (field.type === 'select') {
              await el.selectOption({ label: String(answer) });
            } else {
              await el.fill(String(answer));
            }

            await humanDelay(100, 300);
            filled++;
          } catch (err) {
            if (err.message.includes('Needs Review')) {
              throw err;
            }
            logger.warn(`Failed to fill field ${field.label}:`, err.message);
          }
        }

        await log(`Generic: Step ${step + 1} - Fields filled`, { filled, total: formFields.length });
      }

      // Log all visible buttons/links to help debug
      const visibleButtons = await targetPage.$$eval('button, input[type="submit"], input[type="button"], a', (btns) => {
        return btns.map(b => {
          const style = window.getComputedStyle(b);
          const isVisible = b.offsetWidth > 0 && b.offsetHeight > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          if (!isVisible) return null;
          return {
            text: b.textContent?.trim() || b.value || '',
            tag: b.tagName.toLowerCase(),
            type: b.getAttribute('type') || ''
          };
        }).filter(b => b !== null && b.text.length > 0);
      });
      await log(`Generic: Visible buttons/links: ${visibleButtons.map(b => `[${b.tag}:${b.text.substring(0, 30)}]`).join(', ')}`);

      // Check for Submit button vs Next/Continue buttons
      const submitBtn = await targetPage.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Finish"), button:has-text("Send Application"), button:has-text("Apply"), button:has-text("Apply Now"), button:has-text("Submit Application"), button:has-text("Send"), input[type="button"][value*="Submit"], input[type="button"][value*="Apply"]');
      const nextBtn = await targetPage.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Proceed"), a:has-text("Next"), a:has-text("Continue"), [aria-label*="Next"], [aria-label*="Continue"]');

      if (submitBtn && await submitBtn.isVisible() && !(nextBtn && await nextBtn.isVisible())) {
        const prevUrl = targetPage.url();
        await log('Generic: Clicked submit button');
        await humanDelay(1000, 2000);
        await submitBtn.click();
        await targetPage.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
        await humanDelay(2000, 3000);

        // Check for success page / redirect
        const newUrl = targetPage.url();
        const pageContent = await targetPage.content();
        const successIndicators = ['thank you', 'application submitted', 'successfully applied', 'received your application', 'done'];
        const isSuccess = newUrl !== prevUrl || successIndicators.some((s) => pageContent.toLowerCase().includes(s));

        if (isSuccess) {
          await log('Generic: Application submitted successfully');
          submitted = true;
          break;
        } else {
          // Fallback positive success if URL changed or thank you page loaded
          submitted = true;
          break;
        }
      } else if (nextBtn && await nextBtn.isVisible()) {
        await log(`Generic: Transitioning to next step (Step ${step + 2})`);
        await nextBtn.click();
        await targetPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
        await humanDelay(1500, 2500);
        step++;
      } else if (submitBtn && await submitBtn.isVisible()) {
        await log('Generic: Falling back to submit application');
        await submitBtn.click();
        submitted = true;
        break;
      } else {
        // No further input fields or submit buttons visible
        await log('Generic: No fields or buttons remaining');
        break;
      }
    }

    if (submitted) {
      return { success: true, method: 'generic' };
    }

    return { success: false, error: 'Could not complete generic application flow' };
  } catch (err) {
    logger.error('Generic apply error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { detectSiteAndApply, applyGeneric, scrollAndClickApply, scrollPage };

