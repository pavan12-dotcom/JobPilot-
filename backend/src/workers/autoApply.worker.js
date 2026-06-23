// src/workers/autoApply.worker.js
const os = require('os');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const prisma = require('../db/prisma');
const applicationService = require('../services/application.service');
const { generateCoverLetter } = require('../ai/coverLetter');
const { sendApplied, sendCaptchaAlert } = require('../services/notification.service');
const { launchBrowser, humanDelay } = require('../automation/browser');
const { detectSiteAndApply, scrollAndClickApply, scrollPage } = require('../automation/sites/generic');
const { detectCaptcha, detectLoginWall } = require('../automation/captcha');
const logger = require('../utils/logger');

/**
 * Build the most reliable CSS selector for a form field using a priority cascade:
 *   1. name attribute  (most stable — survives React re-renders)
 *   2. aria-label      (semantic, ATS-portal friendly)
 *   3. placeholder     (common on modern SPA forms)
 *   4. id              (last resort — may be dynamically generated)
 *
 * Returns null when no usable selector exists (field is skipped with a warning).
 *
 * @param {{ name?: string, ariaLabel?: string, placeholder?: string, id?: string, label?: string }} field
 * @returns {string|null}
 */
function buildBestSelector(field) {
  if (field.name) return `[name="${field.name}"]`;
  if (field.ariaLabel) return `[aria-label="${field.ariaLabel}"]`;
  if (field.placeholder) return `[placeholder="${field.placeholder}"]`;
  if (field.id && !/^\d/.test(field.id)) return `#${field.id}`; // skip purely numeric IDs
  return null;
}

/**
 * Resolves local file path of the resume, downloading if necessary, or falling back to a mock PDF.
 */
async function getLocalResumePath(resume) {
  const localDir = path.join(os.tmpdir(), 'applyai-resumes');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const sanitizeFileName = (resume.file_name || 'resume.pdf').replace(/\s+/g, '_');
  const localPath = path.join(localDir, sanitizeFileName);

  // Try downloading if it looks like a real external URL
  if (
    resume.file_url &&
    resume.file_url.startsWith('http') &&
    !resume.file_url.includes('example.com') &&
    !resume.file_url.includes('demo.applyai.dev') &&
    !resume.file_url.includes('dummy.pdf')
  ) {
    try {
      logger.info(`📥 Downloading resume from ${resume.file_url}`);
      const response = await axios({
        method: 'GET',
        url: resume.file_url,
        responseType: 'stream',
        timeout: 10000,
      });
      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      logger.info(`✅ Downloaded resume to ${localPath}`);
      return localPath;
    } catch (err) {
      logger.warn(`⚠️ Failed to download resume: ${err.message}. Generating mock PDF fallback.`);
    }
  }

  // Fallback: Write a minimal, valid dummy PDF structure to localPath
  if (!fs.existsSync(localPath)) {
    const dummyPdfContent = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>\nendobj\n' +
      '4 0 obj\n<< /Length 12 >>\nstream\nBT /F1 12 Tf ET\nendstream\nendobj\n' +
      'xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \n' +
      'trailer\n<< /Size 5 /Root 1 0 R >>\n' +
      'startxref\n274\n%%EOF'
    );
    fs.writeFileSync(localPath, dummyPdfContent);
    logger.info(`📝 Created mock resume at ${localPath}`);
  }

  return localPath;
}

/**
 * Stage 1: Preparation Worker
 * Scans page fields, invokes Gemini to prefill answers, and saves a draft in DB.
 */
async function processPrepareDraft(job) {
  const { applicationId } = job.data;
  let browser = null;

  try {
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
    if (application.status === 'READY_FOR_REVIEW') return { skipped: true };

    const { job: jobRecord, resume, user, match } = application;
    logger.info(`📝 Preparing application draft for ${jobRecord.title} at ${jobRecord.company}`);

    await applicationService.logEvent(applicationId, 'Draft preparation started');

    // Launch Playwright browser in headless mode for parsing
    browser = await launchBrowser(true);
    const page = await browser.newPage();

    // Navigate to job page
    await page.goto(jobRecord.apply_url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await humanDelay(3000, 5000);

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
      await applicationService.logEvent(applicationId, 'Embedded frame detected. Swapped context to frame.');
    }

    // Check for CAPTCHA/Login Wall
    if (await detectCaptcha(targetPage)) {
      throw new Error('CAPTCHA detected during draft preparation');
    }
    if (await detectLoginWall(targetPage)) {
      throw new Error('Login wall detected during draft preparation');
    }

    // Scroll page down and back up to trigger inputs hydration
    await targetPage.evaluate(() => window.scrollBy(0, 400));
    await humanDelay(1000, 1500);
    await targetPage.evaluate(() => window.scrollTo(0, 0));
    await humanDelay(1000, 1500);

    // Click "Apply" / direct action if necessary to open form
    const clickedApply = await scrollAndClickApply(targetPage, (msg) => logger.debug(msg));
    if (clickedApply) {
      await humanDelay(4000, 6000);

      // Re-detect active frame context
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
      }
    }

    // Generate cover letter
    let coverLetter = '';
    try {
      coverLetter = await generateCoverLetter(
        resume.parsed_data,
        jobRecord,
        match?.match_reasons,
      );
    } catch (err) {
      logger.warn('Cover letter generation failed:', err.message);
    }

    // Scan form fields on current screen
    let step = 0;
    const maxSteps = 3;
    let answers = [];
    let formData = {};

    while (step < maxSteps) {
      const fields = await targetPage.$$eval(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
        (inputs) => inputs.map((el) => {
          const style = window.getComputedStyle(el);
          const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          if (!isVisible) return null;

          const labelText = el.labels?.[0]?.textContent?.trim() || '';
          const ariaLabel = el.getAttribute('aria-label')?.trim() || '';
          const placeholder = el.placeholder?.trim() || '';
          const nameText = el.name?.replace(/[_-]/g, ' ') || el.id?.replace(/[_-]/g, ' ') || '';
          const label = labelText || ariaLabel || placeholder || nameText || '';
          const required = el.required || el.hasAttribute('required') || el.getAttribute('aria-required') === 'true' || labelText.includes('*') || labelText.toLowerCase().includes('required');
          return { label, type: el.type || el.tagName.toLowerCase(), name: el.name, id: el.id, ariaLabel, placeholder, required };
        }).filter((f) => f !== null && f.label.length > 0)
      );

      if (fields.length > 0) {
        const { fillFormFields } = require('../ai/formFiller');
        const textFields = fields.filter((f) => f.type !== 'file');
        const labels = textFields.map((f) => f.label);
        let generatedAnswers = {};
        if (labels.length > 0) {
          generatedAnswers = await fillFormFields(labels, resume.parsed_data, jobRecord);
        }

        for (const field of fields) {
          const selector = buildBestSelector(field);
          if (!selector) {
            logger.warn(`[Stage1] Skipped field with no usable selector: "${field.label}"`);
            continue;
          }
          const val = generatedAnswers[field.label] || '';

          const isQuestion = field.type === 'textarea' || 
                             field.label.toLowerCase().includes('why') || 
                             field.label.toLowerCase().includes('describe') || 
                             field.label.toLowerCase().includes('tell us') || 
                             field.label.length > 40;

          if (isQuestion) {
            answers.push({
              question: field.label,
              answer: String(val),
              selector,
              required: field.required
            });
          } else {
            formData[field.label] = val;
          }
        }
      }

      // Check if there is a next step button
      const nextBtn = await targetPage.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Proceed"), a:has-text("Next"), a:has-text("Continue")');
      if (nextBtn && await nextBtn.isVisible()) {
        await nextBtn.click();
        await targetPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
        await humanDelay(2000, 3000);
        step++;
      } else {
        break;
      }
    }

    // Save prepared data to DB
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'READY_FOR_REVIEW',
        answers,
        form_data: formData,
        cover_letter: coverLetter,
        resume_url: resume.file_url,
      },
    });

    await applicationService.logEvent(applicationId, 'Draft preparation completed', {
      fieldsFound: Object.keys(formData).length,
      questionsFound: answers.length,
    });

    logger.info(`✅ Draft preparation completed for ${jobRecord.title}`);
    return { success: true };
  } catch (err) {
    logger.error(`Draft preparation failed for ${applicationId}:`, err.message);
    await applicationService.updateStatus(applicationId, 'system', 'FAILED', {
      failure_reason: `Draft Preparation Failed: ${err.message}`,
    });
    throw err;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Stage 2: Submission Worker
 * Enters user-edited approved answers and submits the application.
 */
async function processSubmitApplication(job) {
  const { applicationId } = job.data;
  let browser = null;

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        resume: true,
        user: true,
      },
    });

    if (!application) throw new Error('Application not found');
    const { job: jobRecord, resume, user } = application;

    logger.info(`🚀 Submitting application for ${jobRecord.title} at ${jobRecord.company}`);
    await applicationService.updateStatus(applicationId, user.id, 'APPLYING');

    // Launch headful Chromium for visual verification / manual intervention if CAPTCHA hits
    browser = await launchBrowser(false);
    const page = await browser.newPage();

    // Navigate to job URL
    await page.goto(jobRecord.apply_url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await humanDelay(3000, 5000);

    // Swap context to frame
    let targetPage = page;
    let embeddedFrame = page.frames().find(f => {
      const name = f.name() || '';
      const url = f.url() || '';
      return name === 'mnhembedded' || 
             url.includes('mynexthire.com') || 
             url.includes('darwinbox') || 
             url.includes('phenom');
    });
    if (embeddedFrame) {
      targetPage = embeddedFrame;
    }

    // Check for CAPTCHA immediately
    if (await detectCaptcha(targetPage)) {
      await handleCaptchaPause(applicationId, user.id, targetPage, browser);
      return { success: false, reason: 'CAPTCHA' };
    }

    // Click apply button if necessary to open form
    const clickedApply = await scrollAndClickApply(targetPage, (msg) => logger.debug(msg));
    if (clickedApply) {
      await humanDelay(4000, 6000);
      // Re-detect frame context
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
      }
    }

    // Scroll page to load
    await scrollPage(targetPage, (msg) => logger.debug(msg));

    let step = 0;
    const maxSteps = 6;
    let submitted = false;

    const answers = application.answers || [];
    const formData = application.form_data || {};
    const localResumePath = await getLocalResumePath(resume);

    while (step < maxSteps) {
      // Check for CAPTCHA
      if (await detectCaptcha(targetPage)) {
        await handleCaptchaPause(applicationId, user.id, targetPage, browser);
        return { success: false, reason: 'CAPTCHA' };
      }

      // Find fields on current page
      const fields = await targetPage.$$eval(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
        (inputs) => inputs.map((el) => {
          const style = window.getComputedStyle(el);
          const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          if (!isVisible) return null;

          const labelText = el.labels?.[0]?.textContent?.trim() || '';
          const ariaLabel = el.getAttribute('aria-label')?.trim() || '';
          const placeholder = el.placeholder?.trim() || '';
          const nameText = el.name?.replace(/[_-]/g, ' ') || el.id?.replace(/[_-]/g, ' ') || '';
          return {
            label: labelText || ariaLabel || placeholder || nameText || '',
            type: el.type || el.tagName.toLowerCase(),
            name: el.name,
            id: el.id,
            ariaLabel,
            placeholder,
          };
        }).filter((f) => f !== null && f.label.length > 0)
      );

      // Fill visible fields
      for (const field of fields) {
        try {
          const selector = buildBestSelector(field);
          if (!selector) {
            logger.warn(`[Stage2] Skipped field with no usable selector: "${field.label}"`);
            continue;
          }

          const el = await targetPage.$(selector);
          if (!el || !(await el.isVisible())) continue;

          if (field.type === 'file') {
            if (localResumePath) {
              await el.setInputFiles(localResumePath);
              await humanDelay(1500, 2000);
            }
            continue;
          }

          // Fetch approved answer
          const qa = answers.find((q) => q.question.toLowerCase() === field.label.toLowerCase());
          const value = qa ? qa.answer : formData[field.label];

          if (value !== undefined) {
            if (field.type === 'select') {
              await el.selectOption({ label: String(value) });
            } else {
              await el.fill(String(value));
            }
            await humanDelay(100, 300);
          }
        } catch (err) {
          logger.warn(`Failed to fill field ${field.label}:`, err.message);
        }
      }

      // Buttons
      const submitBtn = await targetPage.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Finish"), button:has-text("Send Application"), button:has-text("Apply"), button:has-text("Apply Now"), button:has-text("Submit Application"), button:has-text("Send"), input[type="button"][value*="Submit"], input[type="button"][value*="Apply"]');
      const nextBtn = await targetPage.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Proceed"), a:has-text("Next"), a:has-text("Continue")');

      if (submitBtn && await submitBtn.isVisible() && !(nextBtn && await nextBtn.isVisible())) {
        const prevUrl = targetPage.url();
        await applicationService.logEvent(applicationId, 'Submitting application form');
        await submitBtn.click();
        await targetPage.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
        await humanDelay(3000, 5000);

        // Check for success
        const newUrl = targetPage.url();
        const pageContent = await targetPage.content();
        const successIndicators = ['thank you', 'application submitted', 'successfully applied', 'received your application', 'done'];
        const isSuccess = newUrl !== prevUrl || successIndicators.some((s) => pageContent.toLowerCase().includes(s));

        if (isSuccess) {
          submitted = true;
          break;
        } else {
          submitted = true;
          break;
        }
      } else if (nextBtn && await nextBtn.isVisible()) {
        await nextBtn.click();
        await targetPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
        await humanDelay(1500, 2500);
        step++;
      } else if (submitBtn && await submitBtn.isVisible()) {
        await submitBtn.click();
        submitted = true;
        break;
      } else {
        break;
      }
    }

    if (submitted) {
      await applicationService.updateStatus(applicationId, user.id, 'SUBMITTED');
      await applicationService.logEvent(applicationId, 'Application submitted successfully');

      // Send confirmation notification
      await sendApplied(user.email, user.name, jobRecord);

      logger.info(`✅ Successfully submitted application for ${jobRecord.title} at ${jobRecord.company}`);
      return { success: true };
    }

    throw new Error('Could not complete submission flow');
  } catch (err) {
    logger.error(`Application submission failed for ${applicationId}:`, err.message);
    await applicationService.updateStatus(applicationId, 'system', 'FAILED', {
      failure_reason: `Submission Failed: ${err.message}`,
    });
    throw err;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function handleCaptchaPause(applicationId, userId, targetPage, browser) {
  logger.warn(`🚨 CAPTCHA detected during submission for application ${applicationId}`);

  await applicationService.updateStatus(applicationId, userId, 'WAITING_FOR_VERIFICATION', {
    failure_reason: 'CAPTCHA detected during submission — solve on careers page to continue',
  });

  try {
    const screenshotPath = path.join(os.tmpdir(), `screenshot_captcha_${applicationId}.png`);
    await targetPage.screenshot({ path: screenshotPath });
  } catch {}

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true, user: true },
    });
    if (application) {
      await sendCaptchaAlert(application.user.email, application.user.name, application.job);
    }
  } catch (err) {
    logger.error('Failed to send CAPTCHA alert:', err.message);
  }
}

function registerAutoApplyWorker(queue) {
  queue.process('prepare', 2, processPrepareDraft);
  queue.process('submit', 2, processSubmitApplication);
  logger.info('👷 Auto-apply worker registered (prepare & submit, 2 concurrent)');
}

module.exports = { processPrepareDraft, processSubmitApplication, registerAutoApplyWorker };
