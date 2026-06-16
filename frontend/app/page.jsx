'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Target, Bot, Shield, ArrowRight, CheckCircle, Search, Mail, 
  MapPin, GitCompare, Code2, Sparkles, Terminal, Play, Check, Star 
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [simTab, setSimTab] = useState('scoring'); // 'scoring' | 'ab_test' | 'auto_apply'
  const [autoApplyStep, setAutoApplyStep] = useState(0);

  // Auto-apply log steps simulation
  const autoApplyLogs = [
    { type: 'info', text: 'Queue starting: Auto-Apply Mode Active' },
    { type: 'info', text: 'Scanning job boards for "Remote Node.js/React Developer"...' },
    { type: 'success', text: 'Match found: Software Engineer II (Remote) @ Stripe' },
    { type: 'ai', text: 'Claude AI: Evaluating match score against profile...' },
    { type: 'ai', text: 'Score: 94% (Strong fit: 3+ years Node.js & React matches description)' },
    { type: 'info', text: 'Launching virtual browser automation worker...' },
    { type: 'info', text: 'Navigating to application form page...' },
    { type: 'success', text: 'Autofilled basic details (Name, Portfolio, GitHub)...' },
    { type: 'ai', text: 'Claude AI: Generating customized cover letter for Stripe...' },
    { type: 'success', text: 'Customized cover letter and resume uploaded.' },
    { type: 'success', text: 'Form submitted successfully! Capturing confirmation screen.' },
    { type: 'info', text: 'Task completed. Moving to next queue item in 10 minutes.' }
  ];

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('applyai_token');
    if (token) router.push('/dashboard');
  }, []);

  // Cycle auto-apply steps simulation
  useEffect(() => {
    if (simTab !== 'auto_apply') {
      setAutoApplyStep(0);
      return;
    }
    const interval = setInterval(() => {
      setAutoApplyStep((prev) => (prev < autoApplyLogs.length - 1 ? prev + 1 : 0));
    }, 1500);
    return () => clearInterval(interval);
  }, [simTab]);

  if (!mounted) return null;

  const features = [
    { 
      icon: Bot, 
      title: 'AI Resume Matcher', 
      desc: 'Let Claude parse job descriptions and score your fit instantly from 0-100. Know exactly how you rank before applying.' 
    },
    { 
      icon: GitCompare, 
      title: 'A/B Resume Testing', 
      desc: 'Compare multiple versions of your resume side-by-side against any job post. Highlight key strengths and patch missing skills.' 
    },
    { 
      icon: Zap, 
      title: 'Playwright Browser Automation', 
      desc: 'Deploy headless browsers that log in, parse forms, answer questionnaire fields, and submit applications on your behalf.' 
    },
    { 
      icon: Shield, 
      title: 'Safety Filters', 
      desc: 'Keep complete control. Set strict match score thresholds, daily limit counts, and blacklist specific companies.' 
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text overflow-hidden relative selection:bg-primary/20 bg-grid-pattern">
      
      {/* Ambient gradient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-border/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-text">ApplyAI</span>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-sm font-semibold text-text-muted hover:text-text transition-colors">Sign In</Link>
            <Link href="/register" className="btn-primary py-2 px-4 text-xs">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Col */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 rounded-full px-3.5 py-1 text-xs text-primary font-semibold mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered job search automation
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 tracking-tight leading-[1.08] text-text font-display"
          >
            <span className="font-serif italic font-normal text-text/80">Job Search</span> <br />
            <span className="font-extrabold text-primary bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              On Autopilot.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-text-muted mb-8 leading-relaxed max-w-md"
          >
            Upload your resumes, map your targets, let AI score the best matching roles, and launch Playwright browser auto-applies 24/7.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          >
            <Link 
              href="/register" 
              className="btn-primary gap-2 text-sm justify-center shadow-lg"
            >
              Start Applying Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="#simulator" 
              className="btn-secondary justify-center text-sm"
            >
              See Live Demo
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-4 mt-8 text-xs text-text-subtle"
          >
            {['No credit card required', '10 free applies daily', 'GDPR Encrypted'].map((t) => (
              <span key={t} className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-success" /> {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right Col: Interactive Platform Simulation */}
        <div id="simulator" className="lg:col-span-6 w-full flex flex-col">
          {/* Tab Selector */}
          <div className="flex p-1 bg-surface border border-border rounded-xl mb-3 shadow-soft">
            {[
              { id: 'scoring', label: 'AI Scoring', icon: Target },
              { id: 'ab_test', label: 'A/B Testing', icon: GitCompare },
              { id: 'auto_apply', label: 'Auto-Apply Log', icon: Terminal }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSimTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                    simTab === tab.id 
                      ? 'bg-white text-text shadow-sm border border-border/40' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Simulation Container Box */}
          <div className="card h-[360px] overflow-hidden flex flex-col relative border border-border shadow-premium bg-white p-0">
            <div className="bg-surface/50 border-b border-border px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-text-muted font-mono ml-3">demo_simulation.json</span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto font-sans">
              <AnimatePresence mode="wait">
                {simTab === 'scoring' && (
                  <motion.div
                    key="scoring"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Stripe</span>
                        <h4 className="text-base font-bold text-text">Staff API Engineer (Payments)</h4>
                        <p className="text-xs text-text-muted">Remote · Full-Time</p>
                      </div>
                      {/* Big Circle Score */}
                      <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <span className="text-xl font-extrabold text-success leading-none">94%</span>
                        <span className="text-[9px] font-bold text-success/80 mt-0.5">Match</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 bg-surface/50 rounded-xl p-3.5 border border-border/40 text-xs">
                      <p className="font-bold text-text-muted flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-primary" /> Claude AI Evaluation:
                      </p>
                      <p className="text-text-muted italic leading-relaxed">
                        "Your resume demonstrates strong technical capabilities in backend architecture and Node.js. 
                        Your years of experience aligning Stripe APIs makes this a prime fit."
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-success/5 border border-success/20 rounded-xl p-2.5">
                        <p className="font-bold text-success mb-1">Matched Skills</p>
                        <p className="text-text-muted font-mono text-[10px]">✓ Node.js, TypeScript, REST APIs, AWS</p>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5">
                        <p className="font-bold text-primary mb-1">Missing Elements</p>
                        <p className="text-text-muted font-mono text-[10px]">✗ Ruby (Nice to have, not critical)</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {simTab === 'ab_test' && (
                  <motion.div
                    key="ab_test"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="p-3 bg-surface/40 border border-border/60 rounded-xl">
                      <p className="text-xs text-text-muted">Targeting role:</p>
                      <h4 className="text-sm font-bold text-text">Lead React Developer @ Vercel</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* CV version A */}
                      <div className="border border-primary/30 bg-primary/5 rounded-xl p-3 flex flex-col gap-2 relative">
                        <span className="absolute -top-2 left-3 text-[9px] font-bold uppercase text-primary bg-white border border-primary/20 px-1.5 py-0.5 rounded-full">
                          ⭐ Recommended
                        </span>
                        <div className="flex justify-between items-start mt-1">
                          <p className="text-xs font-bold text-text truncate">Frontend Specialist CV</p>
                          <span className="text-sm font-extrabold text-primary">96%</span>
                        </div>
                        <p className="text-[10px] text-text-muted leading-tight">Optimized for Next.js, Performance Tuning, & Tailwind.</p>
                        <div className="mt-auto pt-2 border-t border-border flex items-center justify-between text-[9px]">
                          <span className="text-success font-semibold">Strong Fit</span>
                          <span className="text-text-subtle">Active Profile</span>
                        </div>
                      </div>

                      {/* CV version B */}
                      <div className="border border-border/80 bg-surface/30 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-text truncate">Generic Fullstack CV</p>
                          <span className="text-sm font-extrabold text-text-muted">74%</span>
                        </div>
                        <p className="text-[10px] text-text-muted leading-tight">Mentions database architectures & Java, diluting Vercel fit.</p>
                        <div className="mt-auto pt-2 border-t border-border flex items-center justify-between text-[9px]">
                          <span className="text-warning font-semibold">Moderate Fit</span>
                          <span className="text-text-subtle">Inactive</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {simTab === 'auto_apply' && (
                  <motion.div
                    key="auto_apply"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="font-mono text-[11px] leading-relaxed space-y-1 h-[270px] flex flex-col justify-end text-text-muted bg-surface/20 rounded-xl p-3 border border-border/40"
                  >
                    {autoApplyLogs.slice(0, autoApplyStep + 1).map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-start gap-1.5 ${
                          log.type === 'success' ? 'text-success' :
                          log.type === 'ai' ? 'text-primary' :
                          'text-text-muted'
                        }`}
                      >
                        <span className="shrink-0">{log.type === 'success' ? '✔' : log.type === 'ai' ? '✦' : '❯'}</span>
                        <p>{log.text}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6 relative z-10 border-t border-border/40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-text mb-4 font-display">
              Everything you need to automate your job hunt.
            </h2>
            <p className="text-sm text-text-muted">
              Stop copying, pasting, and typing. Deploy smart agents trained to highlight your experience and submit application templates automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover p-6 rounded-2xl border border-border bg-white flex gap-4">
                <div className="w-12 h-12 bg-primary/10 border border-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-text mb-2 text-base">{title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-20 px-6 relative z-10 bg-surface/30 border-t border-border/40">
        <div className="max-w-3xl mx-auto card border border-border p-10 rounded-3xl text-center shadow-premium bg-white flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-4 text-text font-display">Ready to land interviews on autopilot?</h2>
          <p className="text-text-muted mb-8 text-sm max-w-md">Join hundreds of developers using ApplyAI to skip the line and secure target interviews faster.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <Link 
              href="/register" 
              className="btn-primary w-full sm:w-auto gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/login" 
              className="btn-secondary w-full sm:w-auto"
            >
              Log in with Demo Profile
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-border w-full max-w-md text-xs text-text-subtle">
            <p className="font-medium mb-1">🎯 Demo Credentials available:</p>
            <p className="font-mono text-[11px]">Email: demo@applyai.dev  |  Password: demo123</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-6 relative z-10 text-text-muted text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-medium">© 2026 ApplyAI. Built with Next.js, Claude AI, and Playwright.</p>
          <div className="flex gap-6 text-xs text-text-subtle font-semibold">
            <span>Bengaluru, IN</span>
            <span>contact@applyai.dev</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
