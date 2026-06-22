# JobPilot — Complete Project Documentation

## Table of Contents
1. Project Overview
2. Architecture
3. Tech Stack
4. Folder Structure
5. Database Schema
6. Environment Setup
7. API Documentation
8. AI Features
9. Queue System & Workers
10. Browser Automation
11. Frontend Pages
12. Backend Implementation
13. Authentication & Security
14. Deployment
15. Testing
16. Development Workflow

---

## 1. Project Overview

### What is JobPilot?

JobPilot is a full-stack web application that automates job hunting for students and early-career professionals. Users upload their resume once, set their job preferences, and the platform automatically:
- Fetches job listings from multiple sources (Adzuna, Remotive, The Muse)
- Scores each job against the user's resume using AI
- Generates personalized cover letters
- Auto-applies to matching jobs using browser automation
- Tracks all applications in a centralized dashboard

### Key Features
- **Resume Parsing**: Gemini AI extracts skills, experience, education from uploaded PDF
- **AI Job Matching**: Scores jobs 0-100 based on match with resume
- **Auto-Apply**: Playwright headless browser fills and submits job applications
- **Application Tracking**: Dashboard shows all applications with status, dates, responses
- **Scheduled Jobs**: Set recurring auto-apply schedules (e.g., "Apply to 5 jobs every morning at 9am")
- **Activity Feed**: Real-time notifications of all automation events
- **Job Filtering**: Users can filter recommendations by role, location, salary, job type

### Target Audience
- ECE/CS students in their final year
- Recent graduates (0-2 years experience)
- Career changers looking to streamline job search

### Success Metrics
- User can upload resume and get first job recommendation within 5 minutes
- 80%+ match on recommended jobs (Gemini scoring accuracy)
- Auto-apply success rate >85% (forms filled and submitted without CAPTCHA/login walls)
- Average response time from recruiters measured in dashboard

---

## 2. Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────┐
│                    USER (Web Browser)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ (HTTPS)
         ┌───────────────────────────┐
         │   Next.js Frontend        │
         │ (3001 in dev, /api in prod)│
         └────────────┬──────────────┘
                      │
                      ▼ (REST API calls)
         ┌───────────────────────────┐
         │  Express.js Backend       │
         │  (3000 in dev)             │
         ├───────────────────────────┤
         │ /api/auth                 │
         │ /api/resume               │
         │ /api/jobs                 │
         │ /api/applications         │
         │ /api/schedules            │
         │ /api/dashboard            │
         └────────────┬──────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    PostgreSQL    Redis+Bull    Gemini API
    (Data)        (Queue)       (AI)
        │             │
        │             ├──▶ jobFetch.worker.js
        │             │    └──▶ Adzuna/Remotive APIs
        │             │
        │             ├──▶ jobMatch.worker.js
        │             │    └──▶ Gemini scoring
        │             │
        │             └──▶ autoApply.worker.js
        │                  └──▶ Playwright browser automation
        │
        └──▶ Supabase Storage (PDFs, screenshots)
            Supabase Auth (user login)
```

### System Components

**Frontend Layer**
- Next.js 14 app deployed on Vercel
- Pages: Auth (login/register), Dashboard, Jobs, Applications, Schedules, Settings
- Components: NavBar, Sidebar, JobCard, ApplicationTable, StatsCard, ActivityFeed
- Real-time updates via API polling and WebSockets

**Backend Layer**
- Express.js server deployed on Railway
- REST API endpoints for all CRUD operations
- JWT-based authentication (Supabase tokens & local JWT auth demo)
- Rate limiting, input validation (Zod), centralized error handling

**Data Layer**
- PostgreSQL 15 database (hosted on Supabase)
- Prisma ORM for database access
- Tables: users, resumes, jobs, job_matches, applications, application_logs, schedules, preferences

**Queue & Workers Layer**
- Bull job queue backed by Redis
- Three separate queues: jobFetch, jobMatch, autoApply
- Workers process jobs asynchronously on schedule

**AI Layer**
- Gemini API (gemini-2.5-flash model)
- Used for: resume parsing, job matching, cover letter generation, form field mapping
- All AI calls centralized through config/gemini.js

**Automation Layer**
- Playwright headless browser (Chromium only)
- Handlers for LinkedIn, Indeed, Naukri, and generic forms
- CAPTCHA/login-wall detection with graceful fallback
- Screenshot capture for audit trail

---

## 3. Tech Stack Rationale

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 14 | SSR/SSG for SEO, App Router, built-in API routes, fast deployment |
| **Frontend Styling** | Vanilla CSS + Tailwind CSS | Fast prototyping + full design control |
| **Backend** | Node.js + Express | JavaScript across stack (single language), npm ecosystem, lightweight |
| **Database** | PostgreSQL 15 | Relational, ACID transactions, array/JSON fields for flexible data, mature |
| **ORM** | Prisma | Type-safe, migration management, intuitive API, great DX |
| **Job Queue** | Bull + Redis | In-memory queue, reliable delivery, concurrency control, free tier available |
| **Authentication** | Supabase Auth | Built-in OAuth (Google), JWT tokens, PostgreSQL integration |
| **File Storage** | Supabase Storage | AWS S3 backed, easy to use, free tier, integrated with auth |
| **AI** | Gemini API | Cost-effective (free tier), JSON mode for structured output, fast inference |
| **Browser Automation** | Playwright | Cross-browser, headless mode, good documentation, maintained by Microsoft |
| **Email** | Nodemailer | Simple, works with any SMTP |
| **Logging** | Winston + Morgan | Production-grade, file rotation, multiple transports |
| **Validation** | Zod | TypeScript-native, runtime validation, clear error messages |
| **Deployment** | Vercel (frontend) + Railway (backend) | Zero-config, auto-scaling, free tier, GitHub integration |
| **Version Control** | Git + GitHub | Industry standard, collaboration, CI/CD ready |

---

## 4. Folder Structure

```
applyai/
│
├── frontend/                          # Next.js application
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.jsx
│   │   │   ├── register/
│   │   │   │   └── page.jsx
│   │   │   └── layout.jsx
│   │   ├── onboarding/
│   │   │   └── page.jsx               # Multi-step onboarding wizard
│   │   ├── dashboard/
│   │   │   ├── page.jsx               # Overview, KPIs, activity feed
│   │   │   ├── jobs/
│   │   │   │   ├── page.jsx           # Browse recommended jobs
│   │   │   │   └── [id]/
│   │   │   │       └── page.jsx       # Job detail view
│   │   │   ├── applications/
│   │   │   │   ├── page.jsx           # Application tracker table
│   │   │   │   └── [id]/
│   │   │   │       └── page.jsx       # Application detail + timeline
│   │   │   ├── settings/
│   │   │   │   └── page.jsx           # User settings, preferences
│   │   │   └── layout.jsx             # Sidebar, navbar
│   │   ├── layout.jsx                 # Root layout
│   │   └── page.jsx                   # Landing/redirect
│   │
│   ├── components/
│   │   ├── applications/
│   │   ├── dashboard/
│   │   ├── jobs/
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── api.js                     # Axios instance, base config
│   │   ├── supabase.js                # Supabase client init
│   │   └── websocket.js               # WebSocket client connection manager
│   │
│   ├── .env.example
│   ├── .env.local                     # Local dev env vars
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                           # Node.js + Express application
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── resume.routes.js
│   │   │   │   ├── jobs.routes.js
│   │   │   │   ├── applications.routes.js
│   │   │   │   ├── schedules.routes.js
│   │   │   │   ├── preferences.routes.js
│   │   │   │   ├── dashboard.routes.js
│   │   │   │   └── profile.routes.js
│   │   │   └── middlewares/
│   │   │       ├── auth.middleware.js  # JWT verify
│   │   │       ├── validate.middleware.js # Zod validation
│   │   │       ├── rateLimit.middleware.js
│   │   │       └── errorHandler.middleware.js
│   │   │
│   │   ├── ai/
│   │   │   ├── resumeParser.js        # Gemini: extract resume data
│   │   │   ├── jobMatcher.js          # Gemini: score jobs
│   │   │   ├── coverLetter.js         # Gemini: write cover letters
│   │   │   └── formFiller.js          # Gemini: map form fields
│   │   │
│   │   ├── queues/
│   │   │   ├── jobFetch.queue.js
│   │   │   ├── jobMatch.queue.js
│   │   │   └── autoApply.queue.js
│   │   │
│   │   ├── workers/
│   │   │   ├── jobFetch.worker.js
│   │   │   ├── jobMatch.worker.js
│   │   │   └── autoApply.worker.js
│   │   │
│   │   ├── automation/
│   │   │   ├── browser.js             # Playwright browser launch
│   │   │   ├── captcha.js             # CAPTCHA/login detection
│   │   │   └── sites/
│   │   │       ├── generic.js         # Any HTML form crawler
│   │   │       ├── linkedin.js        # LinkedIn Easy Apply
│   │   │       ├── indeed.js          # Indeed apply
│   │   │       └── naukri.js          # Naukri apply
│   │   │
│   │   ├── services/
│   │   │   ├── resume.service.js      # Resume CRUD, parse logic
│   │   │   ├── job.service.js         # Job CRUD, filtering
│   │   │   ├── application.service.js # Application CRUD, status updates
│   │   │   ├── schedule.service.js    # Schedule CRUD, cron management
│   │   │   └── push.service.js        # Web Push notifications
│   │   │
│   │   ├── db/
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma      # Data model definitions
│   │   │   ├── prisma.js              # Prisma client export
│   │   │   └── seed.js            # Seed demo data
│   │   │
│   │   ├── config/
│   │   │   ├── redis.js               # Redis client setup
│   │   │   ├── gemini.js              # Gemini API client + model config
│   │   │   └── env.js                 # Env var validation
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.js              # Winston logger setup
│   │   │   ├── ApiError.js            # Custom error class
202: └── app.js                     # Express app setup & fallback hourly loop
```

---

## 5. Database Schema

### Prisma Schema Definition

```prisma
// backend/src/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../../../node_modules/.prisma/client"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── Enums ──────────────────────────────────────────────────────────────────

enum JobSource {
  ADZUNA
  REMOTIVE
  THEMUSE
  LINKEDIN
  MANUAL
}

enum JobType {
  FULL_TIME
  PART_TIME
  CONTRACT
  REMOTE
  INTERNSHIP
}

enum ExperienceLevel {
  ENTRY
  MID
  SENIOR
  LEAD
  EXECUTIVE
}

enum ApplicationStatus {
  DRAFT
  QUEUED
  APPLYING
  APPLIED
  READY_FOR_REVIEW
  SUBMITTED
  FAILED
  NEEDS_REVIEW
  WAITING_FOR_VERIFICATION
  INTERVIEW
  OFFER
  REJECTED
  WITHDRAWN
  HIRED
}

enum ApplicationMethod {
  AUTO
  MANUAL
}

// ─── Models ─────────────────────────────────────────────────────────────────

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String
  supabase_id     String?  @unique
  password_hash   String?  // For local auth demo
  is_premium      Boolean  @default(false)
  daily_apply_limit Int    @default(5)
  avatar_url      String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  // Relations
  profile         Profile?
  resumes         Resume[]
  preferences     Preference?
  job_matches     JobMatch[]
  applications    Application[]
  schedules       Schedule[]
  push_subscriptions PushSubscription[]

  @@map("users")
}

model Resume {
  id          String   @id @default(uuid())
  user_id     String
  file_url    String
  file_name   String
  label       String?
  raw_text    String?  @db.Text
  parsed_data Json?
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())

  // Relations
  user         User          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  job_matches  JobMatch[]
  applications Application[]

  @@map("resumes")
}

model Preference {
  id                  String          @id @default(uuid())
  user_id             String          @unique
  target_roles        String[]        @default([])
  target_locations    String[]        @default([])
  min_salary          Int?
  max_salary          Int?
  job_types           JobType[]       @default([])
  experience_level    ExperienceLevel @default(MID)
  blacklisted_companies String[]      @default([])
  preferred_companies String[]        @default([])
  auto_apply_enabled  Boolean         @default(false)
  min_match_score     Int             @default(70)
  updated_at          DateTime        @updatedAt

  // Relations
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("preferences")
}

model Job {
  id           String     @id @default(uuid())
  external_id  String     @unique
  source       JobSource
  title        String
  company      String
  location     String
  job_type     JobType    @default(FULL_TIME)
  description  String     @db.Text
  requirements String?    @db.Text
  salary_min   Int?
  salary_max   Int?
  apply_url    String
  posted_at    DateTime   @default(now())
  expires_at   DateTime?
  is_active    Boolean    @default(true)
  created_at   DateTime   @default(now())

  // Relations
  job_matches  JobMatch[]
  applications Application[]

  @@index([source, is_active, posted_at])
  @@map("jobs")
}

model JobMatch {
  id            String   @id @default(uuid())
  user_id       String
  job_id        String
  resume_id     String
  match_score   Int
  match_reasons Json?
  is_seen       Boolean  @default(false)
  is_saved      Boolean  @default(false)
  created_at    DateTime @default(now())

  // Relations
  user         User          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  job          Job           @relation(fields: [job_id], references: [id], onDelete: Cascade)
  resume       Resume        @relation(fields: [resume_id], references: [id], onDelete: Cascade)
  applications Application[]

  @@unique([user_id, job_id, resume_id])
  @@index([user_id, match_score(sort: Desc)])
  @@map("job_matches")
}

model Application {
  id                 String            @id @default(uuid())
  user_id            String
  job_id             String
  resume_id          String
  match_id           String?
  status             ApplicationStatus @default(DRAFT)
  applied_at         DateTime?
  cover_letter       String?           @db.Text
  application_method ApplicationMethod @default(MANUAL)
  failure_reason     String?
  notes              String?           @db.Text
  follow_up_date     DateTime?
  screenshot_url     String?
  answers            Json?
  form_data          Json?
  resume_url         String?
  created_at         DateTime          @default(now())
  updated_at         DateTime          @updatedAt

  // Relations
  user  User          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  job   Job           @relation(fields: [job_id], references: [id])
  resume Resume       @relation(fields: [resume_id], references: [id])
  match JobMatch?     @relation(fields: [match_id], references: [id])
  logs  ApplicationLog[]

  @@index([user_id, status])
  @@map("applications")
}

model ApplicationLog {
  id             String      @id @default(uuid())
  application_id String
  event          String
  metadata       Json?
  screenshot_url String?
  created_at     DateTime    @default(now())

  // Relations
  application Application @relation(fields: [application_id], references: [id], onDelete: Cascade)

  @@map("application_logs")
}

model Schedule {
  id               String   @id @default(uuid())
  user_id          String
  name             String
  cron_expression  String
  max_applications Int      @default(5)
  is_active        Boolean  @default(true)
  last_run         DateTime?
  next_run         DateTime?
  created_at       DateTime @default(now())

  // Relations
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("schedules")
}

model PushSubscription {
  id         String   @id @default(uuid())
  user_id    String
  endpoint   String   @unique
  p256dh     String
  auth       String
  created_at DateTime @default(now())

  // Relations
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("push_subscriptions")
}

model Profile {
  id                    String   @id @default(uuid())
  user_id               String   @unique
  phone                 String?
  country               String?
  state                 String?
  city                  String?
  linkedin_url          String?
  github_url            String?
  portfolio_url         String?
  current_title         String?
  years_experience      Int?
  skills                String[] @default([])
  projects              Json?    // Array of project details
  certifications        String[] @default([])
  education             Json?    // Array of education details
  previous_companies    String[] @default([])
  expected_salary       Int?
  notice_period         String?
  preferred_industries  String[] @default([])
  work_authorization    String?
  visa_status           String?
  sponsorship_required  Boolean  @default(false)
  relocation_preference String?
  cover_letter_template String?  @db.Text
  certificates_urls     String[] @default([])
  portfolio_files_urls  String[] @default([])

  // Relations
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("profiles")
}
```

---

## 6. Environment Setup

### ⚡ Installation Wizard

Run the interactive setup script in the project root:
```cmd
setup.bat
```
The script will check dependencies, copy environment variables, prompt for credentials (Supabase, Gemini), install Node packages, and build DB schemas.

### Environment Variable Requirements

**`backend/.env`**
```env
PORT=3000
DATABASE_URL="postgresql://postgres:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
REDIS_URL="redis://localhost:6379"
GEMINI_API_KEY="AIzaSy..."
SUPABASE_URL="https://yourproject.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOi..."
BULL_BOARD_USERNAME="admin"
BULL_BOARD_PASSWORD="password"
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL="https://yourproject.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## 7. API Documentation

Key backend endpoints exposed at `http://localhost:3000/api`:

### 7.1 Authentication
* `POST /api/auth/login` - Local mock auth login endpoint (Demo Mode).
* `GET /api/auth/me` - Validates bearer JWT and gets the current logged-in user context.

### 7.2 Resumes
* `POST /api/resume/upload` - Uploads a PDF file, extracts raw text, calls Gemini parser, and saves the parsed details.
* `GET /api/resume` - Retrieves the active active user resume.
* `POST /api/resume/:id/reparse` - Re-triggers Gemini processing on existing raw text.

### 7.3 Jobs
* `GET /api/jobs` - Lists matched jobs with matching scores for the logged-in user.
* `POST /api/jobs/:id/save` - Marks a job match as saved.
* `POST /api/jobs/:id/apply` - Queues an application draft preparation.
* `POST /api/jobs/refresh` - Instantly triggers a fetch sweep on remote job APIs.

### 7.4 Applications Tracker
* `GET /api/applications` - Lists user applications and statuses.
* `GET /api/applications/:id` - Detailed logs timeline.
* `PATCH /api/applications/:id/status` - Manually updates application state.

---

## 8. AI Features (Gemini Integration)

All AI processing leverages the `@google/genai` Node client targeting the `gemini-2.5-flash` model.

### 8.1 Resume Parsing
Converts raw PDF text extraction into highly structured JSON (name, contact info, experience timeline, parsed skills array).

### 8.2 Match Scoring
Given candidate profile and a new job description, Gemini returns a score (0-100), highlighted matching skills, missing skills, and overall role fit explanation.

### 8.3 Form Filling
Dynamically resolves raw DOM field labels crawled by Playwright into semantic answers mapped to specific resume fields.

---

## 9. Queue System & Workers

JobPilot runs **Bull (Redis)** queues to handle asynchronous operations.

```
                  ┌──────────────────────┐
                  │   Redis Bull Queue   │
                  └──────────┬───────────┘
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    [jobFetchQueue]   [jobMatchQueue]   [autoApplyQueue]
        (1 CPU)           (3 CPUs)          (2 CPUs)
```

### 9.1 Job Fetching Worker
* **Source:** `backend/src/workers/jobFetch.worker.js`
* **Flow:** Contacts Adzuna, Remotive, and TheMuse APIs. Checks for new job listings and writes them to PostgreSQL. For every newly discovered active job, enqueues a match job into `jobMatchQueue`.

### 9.2 Job Matching Worker
* **Source:** `backend/src/workers/jobMatch.worker.js`
* **Flow:** Scores candidate resume details against job requirements. Saves match scoring to `job_matches` database. If the match score meets the target threshold and `auto_apply_enabled` is active, creates a new Application in `DRAFT` status and kicks off the `autoApplyQueue`.

### 9.3 Auto-Apply Worker
* **Source:** `backend/src/workers/autoApply.worker.js`
* **Flow:** Runs in a two-stage transactional loop:
  1. **Stage 1 (Prepare):** Crawls the application form headless, generates cover letters, gets Gemini form fillings mapping, and updates database application record to `READY_FOR_REVIEW`.
  2. **Stage 2 (Submit):** Executed when user approves. Opens a visual Chromium browser, maps inputs, attaches files (resume PDF), fills inputs, and submits application.

---

## 10. Browser Automation (Playwright)

Automation scripts reside inside `backend/src/automation/site/`.

### 10.1 Generic Crawling
Scans DOM elements using heuristics:
```javascript
const fields = await page.$$eval('input, textarea, select', (elements) => {
  return elements.map(el => {
    const label = el.labels?.[0]?.textContent || el.placeholder || el.name || '';
    return { label, type: el.type, id: el.id };
  });
});
```

### 10.2 Anti-Detection Features
- Rotating user-agent templates.
- Removing the `navigator.webdriver` browser flag to evade bot detection blockers.
- Enforcing realistic human delays (500–2500ms jitter) between inputs.

### 10.3 CAPTCHA Handling
When reCAPTCHA, hCaptcha, or Cloudflare Turnstile selectors are detected (e.g. `.cf-turnstile`):
1. Immediately pauses.
2. Updates database application status to `WAITING_FOR_VERIFICATION`.
3. Triggers email/Slack alerts prompting the user to solve the CAPTCHA manually.

---

## 11. Frontend Pages (Next.js)

The frontend is a single-page PWA dashboard.

### 11.1 Onboarding screen (`OnboardingScreen.jsx`)
A 7-stage configuration screen:
1. **Resume upload:** Uploads resume PDF and starts AI parsing.
2. **Personal:** Contacts fields pre-filled from resume.
3. **Career:** Extracted job titles and previous companies tags.
4. **Prefs:** Targeted locations (e.g., Remote), job types, and expected salary.
5. **Legal & Docs:** Visa sponsorship requirements and cover letter templates.
6. **Automation:** Custom match score threshold slider and daily limits.
7. **Ready:** Summary preview before entering dashboard.

### 11.2 Explore Screen (`ExploreScreen.jsx`)
Lists matches with live visual gauges. Users can search and filter listings.

### 11.3 Applications Tracker (`SavedScreen.jsx` & `DetailScreen.jsx`)
Displays visual timelines of automation events, failure causes, and screenshots.

---

## 12. Backend Implementation (Express)

- **Express Entrypoint:** `backend/src/app.js` runs Express and registers all router endpoints.
- **WebSocket Gateway:** `backend/src/services/websocket.service.js` keeps connection states active and updates frontend real-time during match and automation changes.
- **Service Layer Pattern:** Clean separation of database logic (`prisma.jobMatch.create`) and router callbacks.

---

## 13. Authentication & Security

- **Supabase Auth:** Integrates Supabase OAuth2 / Google Sign-in token processing.
- **Helmet Security:** Helmet configures standard HTTP security headers.
- **Express Rate Limiter:** Protects routes from denial-of-service threats using a 300 requests / 15 mins window limit.

---

## 14. Deployment

- **Frontend (Vercel):** Frontend folders contain `vercel.json` routing configurations. Built using Next.js build optimization compilation.
- **Backend (Railway):** Built using `railway.toml` and `Dockerfile`. Integrates Postgres instance.

---

## 15. Testing

- **Automation Tests:** A visual mock test environment is available at `backend/src/automation/test/automation.test.js`.
- **Mock Server:** Starts a mock express server mimicking LinkedIn, Indeed, and Generic form pages to test browser automation crawlers locally.
- **Command to run:**
  ```bash
  cd backend
  npm run test:automation
  ```

---

## 16. Development Workflow

- Run `npm install` in frontend and backend.
- Double-click `setup.bat` to launch interactive setup.
- Run `npm run dev` in the root folder to spin up concurrently:
  * **Backend API:** `http://localhost:3000`
  * **Frontend App:** `http://localhost:3001`
  * **Bull Board Queue UI:** `http://localhost:3000/admin/queues` (credentials: `admin` / `password`)
