#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  JobPilot — Interactive Installation Wizard
//  Run: node setup.js
// ─────────────────────────────────────────────────────────────────────────────

const { execSync, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');
const rl   = require('readline');

// ── ANSI colour helpers ───────────────────────────────────────────────────────
const c = {
  reset  : '\x1b[0m',
  bold   : '\x1b[1m',
  dim    : '\x1b[2m',
  green  : '\x1b[32m',
  bGreen : '\x1b[92m',
  cyan   : '\x1b[36m',
  bCyan  : '\x1b[96m',
  yellow : '\x1b[33m',
  red    : '\x1b[31m',
  white  : '\x1b[97m',
  gray   : '\x1b[90m',
  bg     : '\x1b[42m\x1b[30m',
};

const g  = (t) => c.bGreen + t + c.reset;
const cy = (t) => c.bCyan  + t + c.reset;
const y  = (t) => c.yellow + t + c.reset;
const r  = (t) => c.red    + t + c.reset;
const b  = (t) => c.bold   + t + c.reset;
const dim = (t) => c.dim   + t + c.reset;

// ── Banner ────────────────────────────────────────────────────────────────────
function printBanner() {
  console.clear();
  console.log(c.bGreen + c.bold);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   ░░░░░░   ░░░░░  ░░░░░░      ░░░░░  ░░  ░░░░░  ░░████████ ║');
  console.log('║     ░░    ░░   ░░ ░░   ░░    ░░   ░░ ░░ ░░   ░░    ░░      ║');
  console.log('║     ░░    ░░   ░░ ░░░░░░     ░░░░░░░ ░░ ░░░░░░░    ░░      ║');
  console.log('║     ░░    ░░   ░░ ░░   ░░    ░░   ░░ ░░ ░░   ░░    ░░      ║');
  console.log('║     ░░     ░░░░░  ░░░░░░     ░░   ░░ ░░ ░░   ░░    ░░      ║');
  console.log('║                                                              ║');
  console.log('║          AI-Powered Job Application Automation               ║');
  console.log('║                  Installation Wizard v1.0                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(c.reset);
  console.log(dim('  This wizard will set up your local development environment.'));
  console.log(dim('  Estimated time: 2-5 minutes\n'));
}

// ── Readline helpers ──────────────────────────────────────────────────────────
function createInterface() {
  return rl.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(iface, question, defaultVal = '') {
  const hint = defaultVal ? dim(` (${defaultVal})`) : '';
  return new Promise((resolve) => {
    iface.question(`  ${cy('?')} ${question}${hint}: `, (ans) => {
      resolve(ans.trim() || defaultVal);
    });
  });
}

function askSecret(iface, question) {
  return new Promise((resolve) => {
    process.stdout.write(`  ${cy('?')} ${question}: `);
    let val = '';
    const onData = (ch) => {
      ch = ch + '';
      if (ch === '\n' || ch === '\r' || ch === '\u0004') {
        process.stdin.removeListener('data', onData);
        process.stdin.setRawMode && process.stdin.setRawMode(false);
        process.stdout.write('\n');
        resolve(val);
      } else if (ch === '\u0003') {
        process.exit();
      } else if (ch === '\x7f' || ch === '\b') {
        if (val.length > 0) { val = val.slice(0, -1); process.stdout.write('\b \b'); }
      } else {
        val += ch;
        process.stdout.write('*');
      }
    };
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', onData);
    } else {
      // Fallback for non-TTY (Windows CI / piped)
      iface.question('', resolve);
    }
  });
}

// ── Step formatting ───────────────────────────────────────────────────────────
let stepNum = 0;
function step(title) {
  stepNum++;
  console.log(`\n${c.bGreen}┌─ Step ${stepNum}${c.reset} ${b(title)}`);
}

function ok(msg)   { console.log(`  ${g('✔')} ${msg}`); }
function warn(msg) { console.log(`  ${y('⚠')} ${msg}`); }
function err(msg)  { console.log(`  ${r('✘')} ${msg}`); }
function info(msg) { console.log(`  ${cy('›')} ${msg}`); }

// ── Run command with live output ──────────────────────────────────────────────
function run(cmd, cwd, label = '') {
  return new Promise((resolve, reject) => {
    info(`Running: ${dim(cmd)}${label ? ` in ${dim(label)}` : ''}`);
    const child = spawn(cmd, { cwd, shell: true, stdio: 'pipe' });
    child.stdout.on('data', (d) => process.stdout.write(dim('    │ ') + d.toString().replace(/\n/g, '\n' + dim('    │ '))));
    child.stderr.on('data', (d) => process.stdout.write(dim('    │ ') + d.toString().replace(/\n/g, '\n' + dim('    │ '))));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}: ${cmd}`));
    });
  });
}

// ── Check if a command exists ─────────────────────────────────────────────────
function commandExists(cmd) {
  try { execSync(`${cmd} --version`, { stdio: 'ignore' }); return true; }
  catch { return false; }
}

// ── Main wizard ───────────────────────────────────────────────────────────────
async function main() {
  const ROOT     = path.resolve(__dirname);
  const BACKEND  = path.join(ROOT, 'backend');
  const FRONTEND = path.join(ROOT, 'frontend');
  const iface    = createInterface();

  printBanner();

  // ── STEP 1: Prerequisites ──────────────────────────────────────────────────
  step('Checking Prerequisites');

  // Node.js version
  const nodeVer = process.versions.node;
  const [major] = nodeVer.split('.').map(Number);
  if (major >= 18) {
    ok(`Node.js ${nodeVer} ${dim('(required: >=18)')}`);
  } else {
    err(`Node.js ${nodeVer} detected — version 18+ is required.`);
    err('Please upgrade Node.js from https://nodejs.org and re-run this script.');
    process.exit(1);
  }

  // npm
  try {
    const npmVer = execSync('npm --version', { encoding: 'utf8' }).trim();
    ok(`npm ${npmVer}`);
  } catch {
    err('npm not found. Please install Node.js (includes npm) from https://nodejs.org');
    process.exit(1);
  }

  // Docker (optional, only needed for docker-compose workflow)
  if (commandExists('docker')) {
    try {
      const dv = execSync('docker --version', { encoding: 'utf8' }).trim();
      ok(`${dv} ${dim('(optional, for Docker workflow)')}`);
    } catch { /* ignore */ }
  } else {
    warn('Docker not found — you can still run without Docker using local PostgreSQL + Redis.');
  }

  // git
  if (commandExists('git')) {
    const gv = execSync('git --version', { encoding: 'utf8' }).trim();
    ok(gv);
  } else {
    warn('Git not found — installation can continue but version control won\'t work.');
  }

  // ── STEP 2: Backend environment ────────────────────────────────────────────
  step('Configuring Backend Environment');

  const backendEnv     = path.join(BACKEND, '.env');
  const backendEnvEx   = path.join(BACKEND, '.env.example');

  if (!fs.existsSync(backendEnv)) {
    if (fs.existsSync(backendEnvEx)) {
      fs.copyFileSync(backendEnvEx, backendEnv);
      ok('Created backend/.env from .env.example');
    } else {
      err('.env.example not found in backend/. Cannot create .env automatically.');
      process.exit(1);
    }
  } else {
    ok('backend/.env already exists — skipping copy');
  }

  // Read current env
  let envContent = fs.readFileSync(backendEnv, 'utf8');

  const setEnvVar = (content, key, value) => {
    const regex = new RegExp(`^(${key}=).*`, 'm');
    if (regex.test(content)) return content.replace(regex, `$1${value}`);
    return content + `\n${key}=${value}`;
  };

  console.log(`\n  ${b('Configure key API credentials')} ${dim('(press Enter to keep existing value)')}`);

  // DATABASE_URL
  const dbMatch = envContent.match(/^DATABASE_URL=(.*)$/m);
  const dbDefault = dbMatch ? dbMatch[1] : 'postgresql://applyai:applyai_secret@localhost:5432/applyai_db';
  const dbUrl = await ask(iface, 'DATABASE_URL', dbDefault);
  envContent = setEnvVar(envContent, 'DATABASE_URL', dbUrl);

  // GEMINI_API_KEY
  const geminiMatch = envContent.match(/^GEMINI_API_KEY=(.*)$/m);
  const geminiDefault = geminiMatch ? geminiMatch[1] : '';
  const geminiKey = await ask(iface, 'GEMINI_API_KEY', geminiDefault);
  envContent = setEnvVar(envContent, 'GEMINI_API_KEY', geminiKey);

  // SUPABASE_URL
  const supaUrlMatch = envContent.match(/^SUPABASE_URL=(.*)$/m);
  const supaUrlDefault = supaUrlMatch ? supaUrlMatch[1] : 'https://your-project.supabase.co';
  const supaUrl = await ask(iface, 'SUPABASE_URL', supaUrlDefault);
  envContent = setEnvVar(envContent, 'SUPABASE_URL', supaUrl);

  // SUPABASE_SERVICE_KEY
  const supaKeyMatch = envContent.match(/^SUPABASE_SERVICE_KEY=(.*)$/m);
  const supaKeyDefault = supaKeyMatch ? supaKeyMatch[1] : '';
  const supaKey = await ask(iface, 'SUPABASE_SERVICE_KEY', supaKeyDefault);
  envContent = setEnvVar(envContent, 'SUPABASE_SERVICE_KEY', supaKey);

  fs.writeFileSync(backendEnv, envContent);
  ok('backend/.env saved');

  // ── STEP 3: Frontend environment ───────────────────────────────────────────
  step('Configuring Frontend Environment');

  const frontendEnv   = path.join(FRONTEND, '.env.local');
  const frontendEnvEx = path.join(FRONTEND, '.env.example');

  if (!fs.existsSync(frontendEnv)) {
    if (fs.existsSync(frontendEnvEx)) {
      fs.copyFileSync(frontendEnvEx, frontendEnv);
      ok('Created frontend/.env.local from .env.example');
    } else {
      err('.env.example not found in frontend/. Cannot create .env.local automatically.');
      process.exit(1);
    }
  } else {
    ok('frontend/.env.local already exists — skipping copy');
  }

  let feEnvContent = fs.readFileSync(frontendEnv, 'utf8');

  const feSetVar = (content, key, value) => {
    const regex = new RegExp(`^(${key}=).*`, 'm');
    if (regex.test(content)) return content.replace(regex, `$1${value}`);
    return content + `\n${key}=${value}`;
  };

  // Sync Supabase values from backend settings
  if (supaUrl && !supaUrl.startsWith('https://your-project')) {
    feEnvContent = feSetVar(feEnvContent, 'NEXT_PUBLIC_SUPABASE_URL', supaUrl);
  }

  // NEXT_PUBLIC_SUPABASE_ANON_KEY
  const feAnonMatch = feEnvContent.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m);
  const feAnonDefault = feAnonMatch ? feAnonMatch[1] : '';
  const feAnonKey = await ask(iface, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', feAnonDefault);
  feEnvContent = feSetVar(feEnvContent, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', feAnonKey);

  // NEXT_PUBLIC_API_URL
  const feApiMatch = feEnvContent.match(/^NEXT_PUBLIC_API_URL=(.*)$/m);
  const feApiDefault = feApiMatch ? feApiMatch[1] : 'http://localhost:3000';
  const feApiUrl = await ask(iface, 'NEXT_PUBLIC_API_URL', feApiDefault);
  feEnvContent = feSetVar(feEnvContent, 'NEXT_PUBLIC_API_URL', feApiUrl);

  fs.writeFileSync(frontendEnv, feEnvContent);
  ok('frontend/.env.local saved');

  // ── STEP 4: Install backend dependencies ───────────────────────────────────
  step('Installing Backend Dependencies');
  try {
    await run('npm install', BACKEND, 'backend/');
    ok('Backend dependencies installed');
  } catch (e) {
    err(`Backend install failed: ${e.message}`);
    process.exit(1);
  }

  // ── STEP 5: Install frontend dependencies ─────────────────────────────────
  step('Installing Frontend Dependencies');
  try {
    await run('npm install', FRONTEND, 'frontend/');
    ok('Frontend dependencies installed');
  } catch (e) {
    err(`Frontend install failed: ${e.message}`);
    process.exit(1);
  }

  // ── STEP 6: Prisma setup ───────────────────────────────────────────────────
  step('Setting Up Database (Prisma)');

  try {
    await run('npx prisma generate', BACKEND, 'backend/');
    ok('Prisma client generated');
  } catch (e) {
    warn(`Prisma generate failed: ${e.message}`);
  }

  const runMigrate = await ask(iface, 'Run database migrations now? (y/n)', 'y');
  if (runMigrate.toLowerCase() === 'y') {
    try {
      await run('npx prisma migrate deploy', BACKEND, 'backend/');
      ok('Database migrations applied');
    } catch (e) {
      warn(`Migrations failed: ${e.message}`);
      warn('You may need a running PostgreSQL database. Try: docker-compose up -d postgres');
    }
  } else {
    info('Skipped migrations. Run manually: cd backend && npx prisma migrate deploy');
  }

  const runSeed = await ask(iface, 'Seed database with demo data? (y/n)', 'y');
  if (runSeed.toLowerCase() === 'y') {
    try {
      await run('node src/db/seed.js', BACKEND, 'backend/');
      ok('Database seeded with demo data');
    } catch (e) {
      warn(`Seed failed: ${e.message}`);
    }
  }

  // ── STEP 7: Playwright browser ─────────────────────────────────────────────
  step('Installing Playwright Chromium Browser');

  const runPlaywright = await ask(iface, 'Install Chromium for automation? (y/n)', 'y');
  if (runPlaywright.toLowerCase() === 'y') {
    try {
      await run('npx playwright install chromium', BACKEND, 'backend/');
      ok('Playwright Chromium installed');
    } catch (e) {
      warn(`Playwright install failed: ${e.message}`);
    }
  } else {
    info('Skipped Playwright. Run manually: cd backend && npx playwright install chromium');
  }

  iface.close();

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('\n' + c.bGreen + c.bold);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   ✔  Setup Complete!                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(c.reset);

  console.log(`  ${b('Next steps:')}\n`);
  console.log(`  ${g('1.')} Start both servers:      ${cy('npm run dev')}           ${dim('(from root)')}`);
  console.log(`  ${g('2.')} Open the app:            ${cy('http://localhost:3001')}`);
  console.log(`  ${g('3.')} Backend API:             ${cy('http://localhost:3000')}`);
  console.log(`  ${g('4.')} Queue monitor (Bull):    ${cy('http://localhost:3000/admin/queues')}`);
  console.log(`  ${g('5.')} Prisma Studio:           ${cy('cd backend && npx prisma studio')}`);
  console.log(`\n  ${dim('Demo credentials — Email: demo@applyai.dev  |  Password: demo123')}`);
  console.log(`\n  ${dim('Tip: Edit backend/.env and frontend/.env.local to add more API keys.')}\n`);
}

main().catch((e) => {
  console.error(r('\n  Fatal error: ') + e.message);
  process.exit(1);
});
