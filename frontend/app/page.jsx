'use client';
// app/page.jsx — Landing page (redirects to login)
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Target, Bot, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('applyai_token');
    if (token) router.push('/dashboard');
  }, []);

  const features = [
    { icon: Bot, title: 'AI Job Matching', desc: 'Claude AI scores each job against your resume with 0-100 match rating' },
    { icon: Zap, title: 'Auto-Apply', desc: 'Playwright automation fills and submits applications while you sleep' },
    { icon: Target, title: 'Smart Filtering', desc: 'Only applies to jobs above your match threshold — no spam' },
    { icon: Shield, title: 'Full Control', desc: 'Pause, resume, blacklist companies anytime. You\'re always in charge' },
  ];

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">ApplyAI</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="btn-secondary">Sign In</Link>
            <Link href="/register" className="btn-primary">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary-light mb-8">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            AI-powered job automation
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Apply to <span className="gradient-text">100 jobs</span><br />while you sleep
          </h1>

          <p className="text-xl text-text-muted mb-10 max-w-2xl mx-auto">
            Upload your resume. AI matches you with perfect jobs. Playwright automation applies on your behalf — automatically, 24/7.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn-primary py-3 px-8 text-base gap-2">
              Start Applying Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary py-3 px-8 text-base">
              View Demo →
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-text-muted">
            {['No credit card needed', 'Free tier available', '10 auto-applies/day'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-success" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to land your next job
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-text mb-2">{title}</h3>
                <p className="text-text-muted text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto card bg-gradient-to-r from-primary/10 to-card border-primary/20">
          <h2 className="text-2xl font-bold mb-3">Ready to automate your job search?</h2>
          <p className="text-text-muted mb-6">Join thousands of job seekers using ApplyAI to land interviews faster.</p>
          <Link href="/register" className="btn-primary py-3 px-8 gap-2">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-text-subtle text-xs mt-4">Demo credentials: demo@applyai.dev / demo123</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-text-muted text-sm">
        <p>© 2024 ApplyAI · Built with Next.js, Claude AI, and Playwright</p>
        <p className="text-text-subtle text-xs mt-1">Use responsibly · Automation may violate some job sites' ToS</p>
      </footer>
    </div>
  );
}
