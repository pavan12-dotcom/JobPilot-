// src/services/notification.service.js
const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('⚠️ Email not configured — notifications disabled');
    return null;
  }

  transporter = nodemailer.createTransporter({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  return transporter;
}

async function sendEmail(to, subject, html) {
  const transport = getTransporter();
  if (!transport) {
    logger.debug(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }

  await transport.sendMail({ from: env.EMAIL_FROM, to, subject, html });
  logger.info(`📧 Email sent to ${to}: ${subject}`);
}

// ── Email Templates ──────────────────────────────────────────

const baseStyle = `
  font-family: Inter, -apple-system, sans-serif;
  background: #0A0A0F; color: #F8FAFC;
  padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto;
`;

const btnStyle = `
  display: inline-block; background: #6366F1; color: white;
  padding: 12px 24px; border-radius: 8px; text-decoration: none;
  font-weight: 600; margin-top: 16px;
`;

async function sendResumeParsed(email, name, skills = []) {
  const topSkills = skills.slice(0, 5).join(', ');
  await sendEmail(
    email,
    '✅ Your resume has been parsed — ApplyAI',
    `<div style="${baseStyle}">
      <h2 style="color:#6366F1">Resume Parsed Successfully!</h2>
      <p>Hi ${name}, we've analyzed your resume and found the following top skills:</p>
      <p style="background:#1A1A24; padding:16px; border-radius:8px; font-size:16px">
        <strong>${topSkills}</strong>
      </p>
      <p>We're now matching you with relevant jobs. Check your dashboard for recommendations.</p>
      <a href="${env.FRONTEND_URL}/dashboard" style="${btnStyle}">View Dashboard →</a>
    </div>`,
  );
}

async function sendNewMatches(email, name, count, topJob) {
  await sendEmail(
    email,
    `🎯 ${count} new jobs matched your profile — ApplyAI`,
    `<div style="${baseStyle}">
      <h2 style="color:#6366F1">${count} New Job Matches!</h2>
      <p>Hi ${name}, we found ${count} new jobs that match your profile today.</p>
      ${topJob ? `<p>Top match: <strong>${topJob.title} at ${topJob.company}</strong> (${topJob.score}% match)</p>` : ''}
      <a href="${env.FRONTEND_URL}/dashboard/jobs" style="${btnStyle}">View Matches →</a>
    </div>`,
  );
}

async function sendApplied(email, name, job) {
  await sendEmail(
    email,
    `🚀 Applied to ${job.title} at ${job.company} — ApplyAI`,
    `<div style="${baseStyle}">
      <h2 style="color:#22C55E">Application Submitted!</h2>
      <p>Hi ${name}, we've successfully applied to:</p>
      <p style="background:#1A1A24; padding:16px; border-radius:8px">
        <strong>${job.title}</strong> at <strong>${job.company}</strong><br>
        📍 ${job.location}
      </p>
      <a href="${env.FRONTEND_URL}/dashboard/applications" style="${btnStyle}">Track Application →</a>
    </div>`,
  );
}

async function sendCaptchaAlert(email, name, job) {
  await sendEmail(
    email,
    `⚠️ CAPTCHA blocked auto-apply — manual action needed`,
    `<div style="${baseStyle}">
      <h2 style="color:#F59E0B">Manual Apply Required</h2>
      <p>Hi ${name}, our auto-apply was blocked by a CAPTCHA on:</p>
      <p style="background:#1A1A24; padding:16px; border-radius:8px">
        <strong>${job.title}</strong> at <strong>${job.company}</strong>
      </p>
      <p>Please apply manually using the link below:</p>
      <a href="${job.apply_url}" style="${btnStyle}">Apply Manually →</a>
    </div>`,
  );
}

async function sendDailyDigest(email, name, stats) {
  await sendEmail(
    email,
    `📊 Your ApplyAI Daily Report — ${new Date().toLocaleDateString()}`,
    `<div style="${baseStyle}">
      <h2 style="color:#6366F1">Daily Activity Report</h2>
      <p>Hi ${name}, here's your job hunt summary for today:</p>
      <table style="width:100%; background:#1A1A24; border-radius:8px; padding:16px; border-collapse:collapse">
        <tr><td style="padding:8px">📤 Applications Sent</td><td style="padding:8px; text-align:right"><strong>${stats.applied}</strong></td></tr>
        <tr><td style="padding:8px">🎯 New Matches</td><td style="padding:8px; text-align:right"><strong>${stats.matched}</strong></td></tr>
        <tr><td style="padding:8px">📅 Interviews</td><td style="padding:8px; text-align:right"><strong>${stats.interviews}</strong></td></tr>
      </table>
      <a href="${env.FRONTEND_URL}/dashboard" style="${btnStyle}">Open Dashboard →</a>
    </div>`,
  );
}

module.exports = {
  sendResumeParsed,
  sendNewMatches,
  sendApplied,
  sendCaptchaAlert,
  sendDailyDigest,
};
