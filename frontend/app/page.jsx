'use client';
// app/page.jsx — Landing page (mockup redesign)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Target, Bot, Shield, ArrowRight, CheckCircle, Search, Mail, MapPin } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('applyai_token');
    if (token) router.push('/dashboard');
  }, []);

  const features = [
    { icon: Bot, title: 'AI Job Matching', desc: 'Claude AI scores each job against your resume with 0-100 match rating' },
    { icon: Zap, title: 'Auto-Apply', desc: 'Playwright automation fills and submits applications while you sleep' },
    { icon: Target, title: 'Smart Filtering', desc: 'Only applies to jobs above your match threshold — no spam' },
    { icon: Shield, title: 'Full Control', desc: 'Pause, resume, blacklist companies anytime. You\'re always in charge' },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#06050C] text-text overflow-hidden relative selection:bg-violet-500/30 selection:text-violet-200">
      {/* Background Neon Glow & Abstract Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[180px]" />
        <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-fuchsia-900/5 rounded-full blur-[130px]" />
        
        {/* Soft grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">ApplyAI</span>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-sm font-medium text-text-muted hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="btn-primary py-2 px-4 text-xs font-semibold">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-24 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Typography & CTA */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-300 mb-6 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            AI-powered job automation
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-light mb-6 tracking-tight leading-none text-white"
          >
            <span className="font-serif italic font-normal text-slate-300">Job Search</span> <br />
            <span className="font-sans font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              is Evolving
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-text-muted mb-8 leading-relaxed max-w-lg"
          >
            Are you ahead or behind? Upload your resume, let Claude score matching roles, and run Playwright browser auto-applies 24/7.
          </motion.p>

          {/* Premium Capsule Button (Mockup styling) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link 
              href="/register" 
              className="inline-flex items-center gap-6 pl-6 pr-2 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full border border-violet-400/40 hover:border-violet-400/70 shadow-[0_8px_30px_rgba(139,92,246,0.35)] hover:shadow-[0_8px_40px_rgba(139,92,246,0.5)] transition-all duration-300 group"
            >
              <span className="font-semibold text-white text-sm tracking-wide">Start Applying</span>
              <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ArrowRight className="w-4 h-4 text-white" />
              </span>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-4 mt-8 text-xs text-text-subtle"
          >
            {['No credit card required', 'Free tier included', '10 auto-applies/day'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-success/80" /> {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right Side: Floating Glassmorphic Mockup Cards */}
        <div className="lg:col-span-6 relative w-full h-[450px] flex items-center justify-center">
          {/* Card 1: Google Search Mockup */}
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
            className="absolute top-4 left-4 right-4 md:left-8 md:right-8 p-5 rounded-2xl glass border border-white/8 shadow-2xl z-20 flex flex-col gap-3"
          >
            {/* Search Input */}
            <div className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3">
              <Search className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-text-muted font-mono">best remote software developer jobs...</span>
            </div>
            {/* Search Result */}
            <div className="p-3 bg-violet-950/20 border border-violet-500/10 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Staff Engineer (Remote) — Match Found</p>
                <p className="text-[10px] text-text-muted mt-1 leading-normal">Matched 96% against your active resume. Cover letter generated.</p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: AI Match Score Dial */}
          <motion.div 
            initial={{ x: -40, y: 60, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.25 }}
            className="absolute bottom-6 left-4 md:left-8 w-[220px] p-5 rounded-2xl glass border border-white/8 shadow-2xl z-30 flex items-center gap-4"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
                <motion.circle 
                  cx="32" 
                  cy="32" 
                  r="26" 
                  stroke="var(--success)" 
                  strokeWidth="4" 
                  fill="transparent"
                  strokeDasharray="163.3"
                  initial={{ strokeDashoffset: 163.3 }}
                  animate={{ strokeDashoffset: 163.3 - (163.3 * 96) / 100 }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold text-success">96%</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">AI Score Score</p>
              <p className="text-[10px] text-success/80 mt-0.5">Excellent Match</p>
            </div>
          </motion.div>

          {/* Card 3: Keyword/Role Matches List */}
          <motion.div 
            initial={{ x: 40, y: 60, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.3 }}
            className="absolute bottom-6 right-4 md:right-8 w-[240px] p-5 rounded-2xl glass border border-white/8 shadow-2xl z-30 flex flex-col gap-3"
          >
            <p className="text-xs font-bold text-white">Keyword Rankings</p>
            <div className="flex flex-col gap-2">
              {[
                { rank: '#1', role: 'Software Engineer', trend: '↑' },
                { rank: '#2', role: 'React Developer', trend: '↑' },
                { rank: '#3', role: 'Fullstack Architect', trend: '↓' }
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-white/5 last:border-0">
                  <span className="text-violet-400 font-mono">{r.rank}</span>
                  <span className="text-text-muted truncate max-w-[130px]">{r.role}</span>
                  <span className={r.trend === '↑' ? 'text-success' : 'text-error'}>{r.trend}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grids */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-16 tracking-tight text-white">
            Everything you need to land your next job
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover p-6 border border-white/6 rounded-2xl bg-white/[0.02] backdrop-blur-xl">
                <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-bold text-text mb-2 text-base text-white">{title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-2xl mx-auto card bg-gradient-to-r from-violet-950/20 to-card border border-violet-500/25 p-8 rounded-3xl text-center shadow-[0_15px_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
          <h2 className="text-3xl font-extrabold mb-4 text-white tracking-tight">Ready to automate your search?</h2>
          <p className="text-text-muted mb-8 text-sm max-w-md">Join thousands of job seekers using ApplyAI to land interviews faster.</p>
          <Link 
            href="/register" 
            className="inline-flex items-center gap-6 pl-6 pr-2 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full border border-violet-400/40 hover:border-violet-400/70 shadow-[0_8px_30px_rgba(139,92,246,0.35)] hover:shadow-[0_8px_40px_rgba(139,92,246,0.5)] transition-all duration-300 group"
          >
            <span className="font-semibold text-white text-sm tracking-wide">Get Started Free</span>
            <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <ArrowRight className="w-4 h-4 text-white" />
            </span>
          </Link>
          <p className="text-text-subtle text-xs mt-6">Demo credentials: <span className="text-white/80 font-mono">demo@applyai.dev</span> / <span className="text-white/80 font-mono">demo123</span></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 relative z-10 text-text-muted text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© 2026 ApplyAI · Built with Next.js, Claude AI, and Playwright</p>
          <div className="flex gap-6 text-xs text-text-subtle">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-violet-400" /> Bengaluru, IN</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-violet-400" /> contact@applyai.dev</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

