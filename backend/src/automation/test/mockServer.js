// src/automation/test/mockServer.js
const express = require('express');
const path = require('path');

function createMockServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // LinkedIn Easy Apply Flow
  app.get('/linkedin', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LinkedIn Job Listing</title>
        <style>
          .hidden { display: none !important; }
          .jobs-easy-apply-modal { border: 1px solid #ccc; padding: 20px; background: white; }
        </style>
      </head>
      <body>
        <h1>Software Engineer Role</h1>
        <button class="jobs-apply-button" aria-label="Easy Apply to Software Engineer">Easy Apply</button>

        <div id="modal-container" class="hidden">
          <div class="jobs-easy-apply-modal">
            <h2>Easy Apply Form</h2>
            
            <div id="step-0" class="step">
              <label for="phoneNumber">Phone Number</label>
              <input type="text" id="phoneNumber" name="phoneNumber" value="">
              <button class="nav-btn" id="next-btn" aria-label="Next">Next</button>
            </div>

            <div id="step-1" class="step hidden">
              <label for="city-input">City</label>
              <input type="text" id="city-input" name="location" value="">
              <button class="nav-btn" id="review-btn" aria-label="Review your application">Review</button>
            </div>

            <div id="step-2" class="step hidden">
              <h3>Review Your Details</h3>
              <p>Please confirm details below.</p>
              <button class="nav-btn" id="submit-btn" aria-label="Submit application">Submit application</button>
            </div>

            <div id="step-success" class="step hidden">
              <div class="artdeco-inline-feedback--success">Application Submitted Successfully!</div>
            </div>
          </div>
        </div>

        <script>
          const applyBtn = document.querySelector('.jobs-apply-button');
          const modal = document.getElementById('modal-container');
          const step0 = document.getElementById('step-0');
          const step1 = document.getElementById('step-1');
          const step2 = document.getElementById('step-2');
          const stepSuccess = document.getElementById('step-success');

          applyBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
          });

          document.getElementById('next-btn').addEventListener('click', () => {
            step0.classList.add('hidden');
            step1.classList.remove('hidden');
          });

          document.getElementById('review-btn').addEventListener('click', () => {
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
          });

          document.getElementById('submit-btn').addEventListener('click', () => {
            step2.classList.add('hidden');
            stepSuccess.classList.remove('hidden');
          });
        </script>
      </body>
      </html>
    `);
  });

  // Indeed Application Flow
  app.get('/indeed', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Indeed Job Application</title>
        <style>
          .hidden { display: none !important; }
        </style>
      </head>
      <body>
        <h1>Indeed Job Application</h1>
        <button id="indeedApplyButton">Apply Now</button>

        <div id="form-container" class="hidden">
          <form id="apply-form" method="POST" action="/indeed-submit">
            <div>
              <label for="input-applicant.name">Full Name</label>
              <input type="text" id="input-applicant.name" name="applicant.name">
            </div>
            <div>
              <label>Email</label>
              <input type="email" name="applicant.email">
            </div>
            <div>
              <label>Phone Number</label>
              <input type="tel" name="applicant.phoneNumber">
            </div>
            
            <!-- Screening questions -->
            <div class="ia-Questions-item-label">How many years of experience do you have?</div>
            <input type="text" placeholder="Years of experience" name="q_experience">

            <div class="ia-Questions-item-label">Are you willing to relocate?</div>
            <input type="text" placeholder="Relocate" name="q_relocate">

            <button class="ia-continueButton" type="submit">Submit Application</button>
          </form>
        </div>

        <script>
          document.getElementById('indeedApplyButton').addEventListener('click', () => {
            document.getElementById('form-container').classList.remove('hidden');
          });
        </script>
      </body>
      </html>
    `);
  });

  app.post('/indeed-submit', (req, res) => {
    res.send('<h1>Application Submitted</h1>');
  });

  // Naukri Application Flow
  app.get('/naukri', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Naukri Job Listing</title>
      </head>
      <body>
        <h1>Naukri Software Engineer Listing</h1>
        <button class="apply-btn">Apply</button>
        
        <form id="naukri-form" style="display:none;" action="/naukri-submit" method="POST">
          <button type="submit" class="btn-apply">Submit Quick Apply</button>
        </form>

        <script>
          document.querySelector('.apply-btn').addEventListener('click', () => {
            document.getElementById('naukri-form').style.display = 'block';
          });
        </script>
      </body>
      </html>
    `);
  });

  app.post('/naukri-submit', (req, res) => {
    res.send('<h1>Naukri Form Submitted</h1>');
  });

  // Generic Job Board
  app.get('/generic', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Generic Job Board</title>
      </head>
      <body>
        <h1>Generic Software Engineer</h1>
        <button id="apply-btn">Apply Now</button>

        <form id="generic-form" style="display:none;" action="/generic-submit" method="POST">
          <div>
            <label for="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name">
          </div>
          <div>
            <label for="email_addr">Email Address</label>
            <input type="text" id="email_addr" name="email_addr">
          </div>
          <div>
            <label for="total_years_exp">Years of Experience</label>
            <input type="text" id="total_years_exp" name="total_years_exp">
          </div>
          <button type="submit">Submit</button>
        </form>

        <script>
          document.getElementById('apply-btn').addEventListener('click', () => {
            document.getElementById('generic-form').style.display = 'block';
          });
        </script>
      </body>
      </html>
    `);
  });

  app.post('/generic-submit', (req, res) => {
    res.send('<h1>thank you! application submitted</h1>');
  });

  // CAPTCHA page
  app.get('/captcha', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Captcha Challenge Page</title>
      </head>
      <body>
        <h1>Security Check</h1>
        <div class="cf-turnstile">Cloudflare Turnstile placeholder</div>
        <p>Please complete the verification</p>
      </body>
      </html>
    `);
  });

  // Login Wall page
  app.get('/login-wall', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sign In Required</title>
      </head>
      <body>
        <h1>Sign In to Job Board</h1>
        <form>
          <input type="password" placeholder="Password">
          <button type="submit">Sign In</button>
        </form>
      </body>
      </html>
    `);
  });

  return app;
}

module.exports = { createMockServer };
