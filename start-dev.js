#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  JobPilot — Concurrent Dev Server Launcher
//  Run: node start-dev.js  OR  npm run dev  (from root)
// ─────────────────────────────────────────────────────────────────────────────

const { spawn } = require('child_process');
const path = require('path');

const ROOT     = path.resolve(__dirname);
const BACKEND  = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');

// ── ANSI colours ─────────────────────────────────────────────────────────────
const green  = (t) => `\x1b[92m${t}\x1b[0m`;
const cyan   = (t) => `\x1b[96m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const red    = (t) => `\x1b[91m${t}\x1b[0m`;
const bold   = (t) => `\x1b[1m${t}\x1b[0m`;
const dim    = (t) => `\x1b[2m${t}\x1b[0m`;

// ── Banner ────────────────────────────────────────────────────────────────────
console.log('\n' + bold(green('╔══════════════════════════════════════════════╗')));
console.log(bold(green('║') + '  🚀 JobPilot Dev Server Launcher             ' + green('║')));
console.log(bold(green('╚══════════════════════════════════════════════╝')));
console.log(dim('  Starting Backend (port 3000) + Frontend (port 3001)...\n'));

// ── Process store for cleanup ─────────────────────────────────────────────────
const processes = [];

// ── Spawn helper ─────────────────────────────────────────────────────────────
function startProcess(label, colour, cmd, cwd) {
  const tag    = colour(`[${label}]`);
  const prefix = `${tag} `;

  const child = spawn(cmd, { cwd, shell: true, stdio: 'pipe' });
  processes.push({ label, child });

  // ── stdout ──────────────────────────────────────────────────────────────────
  child.stdout.on('data', (data) => {
    data.toString().split('\n').forEach((line) => {
      if (line.trim()) console.log(`${prefix}${line}`);
    });
  });

  // ── stderr ──────────────────────────────────────────────────────────────────
  child.stderr.on('data', (data) => {
    data.toString().split('\n').forEach((line) => {
      if (line.trim()) console.log(`${prefix}${dim(line)}`);
    });
  });

  // ── on exit ─────────────────────────────────────────────────────────────────
  child.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.log(`\n${red(`[${label}]`)} Process exited with code ${red(code)}`);
      console.log(yellow('  Shutting down all processes...'));
      killAll();
      setTimeout(() => process.exit(1), 500);
    } else if (code === 0) {
      console.log(`\n${colour(`[${label}]`)} Process exited cleanly.`);
    }
  });

  child.on('error', (err) => {
    console.log(`${red(`[${label}]`)} Failed to start: ${err.message}`);
    killAll();
    process.exit(1);
  });

  return child;
}

// ── Kill all spawned processes ────────────────────────────────────────────────
function killAll() {
  for (const { label, child } of processes) {
    try {
      child.kill('SIGTERM');
      console.log(dim(`  Stopped [${label}]`));
    } catch (_) { /* already dead */ }
  }
}

// ── Graceful shutdown on Ctrl+C ───────────────────────────────────────────────
process.on('SIGINT',  () => { console.log(yellow('\n\n  Ctrl+C detected — shutting down gracefully...')); killAll(); setTimeout(() => process.exit(0), 800); });
process.on('SIGTERM', () => { killAll(); setTimeout(() => process.exit(0), 800); });

// ── Start both servers ────────────────────────────────────────────────────────
startProcess('Backend',  green,  'npm run dev', BACKEND);
startProcess('Frontend', cyan,   'npm run dev', FRONTEND);

// ── Info tip after 2 s ────────────────────────────────────────────────────────
setTimeout(() => {
  console.log('\n' + dim('─'.repeat(54)));
  console.log(`  ${bold('App URLs:')}`);
  console.log(`  ${cyan('›')} Frontend   ${cyan('http://localhost:3001')}`);
  console.log(`  ${green('›')} Backend    ${green('http://localhost:3000')}`);
  console.log(`  ${green('›')} Queue UI   ${green('http://localhost:3000/admin/queues')}`);
  console.log(dim('─'.repeat(54)));
  console.log(dim('  Press Ctrl+C to stop all servers.\n'));
}, 2000);
