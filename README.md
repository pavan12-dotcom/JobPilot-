# ApplyAI — AI-Powered Job Application Automation Platform

> Automatically apply to hundreds of matching jobs using AI-powered resume parsing, job matching, and browser automation.

---

## What Is This?

ApplyAI is a full-stack platform that automates your job search end-to-end:

1. **Upload your resume** → Claude AI extracts your skills, experience, and preferred roles
2. **Set preferences** → target roles, locations, salary range, match score threshold
3. **AI matches jobs** → Claude scores every new job against your resume (0–100)
4. **Auto-apply** → Playwright browser automation fills and submits applications for 70%+ matches
5. **Track everything** → Full application tracker with status, cover letters, automation logs

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 14)                   │
│  Landing → Login → Onboarding → Dashboard → Jobs → Applications │
│                    Tailwind CSS + Recharts + Framer Motion       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (axios)
┌───────────────────────────▼─────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                 │
│                                                                  │
│  Routes: auth / resume / jobs / applications / schedules        │
│  AI:     Claude (parse + match + cover letter + form fill)       │
│  Queue:  Bull + Redis → 3 workers (fetch / match / apply)        │
│  DB:     PostgreSQL 15 via Prisma ORM                           │
│  Auth:   Supabase JWT (+ local JWT demo mode)                   │
│  Store:  Supabase Storage (resume PDFs + screenshots)            │
└───────────┬───────────────────────────────────────────┬─────────┘
            │                                           │
┌───────────▼────────┐                    ┌─────────────▼────────┐
│  PostgreSQL 15     │                    │  Redis 7             │
│  (Prisma schema)   │                    │  (Bull queues)       │
└────────────────────┘                    └──────────────────────┘
            │
┌───────────▼────────────────────────────────────────┐
│              BULL WORKERS                          │
│                                                    │
│  jobFetch.worker  → Adzuna + Remotive + TheMuse   │
│  jobMatch.worker  → Claude AI scoring             │
│  autoApply.worker → Playwright browser automation │
└────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) | Server components, file routing, production-ready |
| Styling | Tailwind CSS + custom CSS | Fast prototyping + full design control |
| Auth | Supabase Auth | Google OAuth + email, managed JWTs |
| Storage | Supabase Storage | Managed file storage for PDFs + screenshots |
| Backend | Node.js + Express | Fast, familiar, huge ecosystem |
| Database | PostgreSQL 15 + Prisma | JSONB for parsed data, strong type safety |
| Queue | Bull + Redis | Reliable background jobs, rate limiting, retries |
| AI | Claude Sonnet (claude-sonnet-4-5) | Best-in-class at structured JSON extraction |
| Automation | Playwright (Chromium) | Most reliable browser automation library |
| Job APIs | Adzuna + Remotive + TheMuse | Free tiers, wide coverage |
| Email | Nodemailer | Simple, works with any SMTP |
| Deploy | Railway (backend) + Vercel (frontend) | Zero-config deployment |

---

## Local Setup

### Prerequisites
- Node.js 18+
- Docker Desktop
- Git

### Quick Start

```bash
# 1. Clone and enter directory
git clone <repo-url> applyai
cd applyai

# 2. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start all services (PostgreSQL + Redis + Backend + Frontend)
docker-compose up -d

# 4. Run database migrations
docker exec applyai_backend npx prisma migrate deploy

# 5. Seed demo data
docker exec applyai_backend node src/db/seed.js

# 6. Open the app
open http://localhost:3001
```

### Without Docker (local dev)

```bash
# Install backend dependencies
cd backend && npm install

# Copy and configure .env
cp .env.example .env
# Edit .env with your DATABASE_URL and REDIS_URL

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed data
node src/db/seed.js

# Start backend
npm run dev
# → http://localhost:3000

# In another terminal: install and start frontend
cd ../frontend && npm install
cp .env.example .env.local
npm run dev
# → http://localhost:3001
```

---

## Demo Credentials

```
Email:    demo@applyai.dev
Password: demo123
```

**Demo data includes:**
- 1 parsed resume (Alex Kumar, 3yr Software Engineer)
- 20 seeded jobs from Adzuna, Remotive, TheMuse
- 15 job matches with scores 55–96%
- 8 applications: 3 Applied, 2 Interview, 1 Offer, 1 Rejected, 1 Failed
- 2 active auto-apply schedules

---

## How AI Features Work

### Resume Parsing
PDF → `pdf-parse` (text extraction) → Claude Sonnet prompt → structured JSON saved to `resumes.parsed_data`

The Claude prompt asks for: name, email, phone, skills array, experience array, education, total years, current role, preferred roles, and a 2-sentence summary.

### Job Matching
For each new job × each active user resume:
- Pre-filter by user preferences (location, job type)
- Send job description + resume data to Claude
- Claude returns: match_score (0–100), skills_matched, skills_missing, experience_fit, role_alignment, summary
- Scores saved to `job_matches` table
- If score ≥ `min_match_score` AND `auto_apply_enabled` → enqueue auto-apply

Claude is instructed to be strict: 70+ only for genuinely strong matches.

### Cover Letter Generation
Before each application, Claude generates a personalized ≤200 word cover letter using the candidate's actual experience and the specific job description. It's instructed to avoid generic phrases and sound human and specific.

### Form Filling
Playwright extracts all form field labels from the DOM and sends them to Claude with the candidate's resume data. Claude returns a JSON mapping of field → answer. The worker then fills each field.

---

## Playwright Automation

**Supported sites:**
- **LinkedIn** — Easy Apply button, multi-step form, cover letter paste
- **Indeed** — Apply Now flow, screening questions via Claude
- **Naukri** — Quick apply (login wall detection + graceful skip)
- **Generic** — DOM scanning + Claude form filling for any other site

**Anti-detection:**
- Random user agents (3 rotating Chrome versions)
- Randomized delays between actions (500–2000ms)
- `navigator.webdriver` flag removed
- Realistic viewport (1280×800) and locale settings

**CAPTCHA handling:**
- Detects reCAPTCHA, hCaptcha, Cloudflare Turnstile
- Stops automation immediately
- Sets application status to `FAILED`
- Sends email alert with direct job link for manual apply

---

## ⚠️ Ethical Use Notice

Browser automation may violate the Terms of Service of job platforms including LinkedIn, Indeed, and Naukri. This code is provided for educational purposes. Use responsibly:

- Respect rate limits and daily limits
- Only apply to jobs you are genuinely qualified for
- Review and customize applications before submitting
- Disable auto-apply and apply manually when requested by employers

The authors are not responsible for account bans or ToS violations.

---

## Queue Monitoring

Bull Board UI is available at: `http://localhost:3000/admin/queues`

Default credentials: `admin` / `admin123` (change in `.env`)

---

## Environment Variables

See [`backend/.env.example`](./backend/.env.example) for all required variables.

**Required for full functionality:**
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis for Bull queues
- `ANTHROPIC_API_KEY` — Claude AI for parsing/matching/letters
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` — Auth + file storage

**Optional (fall back to demo mode without):**
- `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` — Job fetching
- `THEMUSE_API_KEY` — Company culture jobs
- `SMTP_USER` + `SMTP_PASS` — Email notifications

---

## API Reference

Base URL: `http://localhost:3000/api`

All protected routes require: `Authorization: Bearer <token>`

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Local login (demo mode) |
| GET | `/auth/me` | Get current user |

### Resume
| Method | Path | Description |
|--------|------|-------------|
| POST | `/resume/upload` | Upload + parse PDF |
| GET | `/resume` | Get active resume |
| POST | `/resume/:id/reparse` | Re-run Claude parser |

### Jobs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/jobs?min_score=70&job_type=REMOTE` | Get recommended jobs |
| POST | `/jobs/:id/apply` | Manually trigger apply |
| POST | `/jobs/:id/save` | Save/unsave job |
| POST | `/jobs/refresh` | Trigger fresh job fetch |

### Applications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/applications` | List applications |
| GET | `/applications/:id` | Detail + logs |
| PATCH | `/applications/:id/status` | Update status |
| DELETE | `/applications/:id` | Withdraw |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/stats` | KPI metrics |
| GET | `/dashboard/activity` | Activity feed |
| GET | `/dashboard/insights` | AI insights |

---

## Deployment

### Railway (Backend)
1. Connect your GitHub repo to Railway
2. Set all environment variables in Railway dashboard
3. Railway auto-deploys on push

### Vercel (Frontend)
1. Import the `frontend/` directory to Vercel
2. Set `NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app`
3. Set Supabase env vars

### Manual Deploy
```bash
# Backend
cd backend
npm ci --production
npx prisma migrate deploy
node src/db/seed.js  # optional
node src/app.js

# Frontend
cd frontend
npm ci
npm run build
npm start
```

---

## Future Roadmap

- [ ] Chrome extension for one-click apply from any job board
- [ ] LinkedIn API integration (official, no automation)
- [ ] Resume version A/B testing with match score comparison
- [ ] Interview scheduling assistant
- [ ] Salary negotiation AI coach
- [ ] Company research summaries from Glassdoor + LinkedIn
- [ ] Multi-resume support (tailor per role)
- [ ] Mobile app (React Native)
- [ ] Team/agency mode for recruiters

---

## Project Structure

```
applyai/
├── docker-compose.yml
├── README.md
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── ai/                # Claude AI integrations
│   │   ├── api/routes/        # Express route handlers
│   │   ├── api/middlewares/   # Auth, validation, errors
│   │   ├── automation/        # Playwright browser handlers
│   │   ├── config/            # Redis, Claude, env config
│   │   ├── db/                # Prisma schema + seed
│   │   ├── queues/            # Bull queue definitions
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Logger, ApiError
│   │   ├── workers/           # Queue processors
│   │   └── app.js             # Express entry point
│   ├── Dockerfile
│   └── package.json
└── frontend/                   # Next.js 14 App Router
    ├── app/
    │   ├── (auth)/            # Login + Register
    │   ├── dashboard/         # All dashboard pages
    │   ├── onboarding/        # 4-step wizard
    │   └── page.jsx           # Landing page
    ├── components/
    │   ├── applications/
    │   ├── dashboard/
    │   ├── jobs/
    │   └── ui/
    ├── lib/
    │   ├── api.js             # Axios client
    │   └── supabase.js        # Supabase client
    └── package.json
```

---

*Built with ❤️ using Next.js 14, Claude AI, Playwright, Bull, and PostgreSQL*
