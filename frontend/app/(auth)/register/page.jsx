'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, User, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user placeholder mapping to local state/session
      const dummyUser = { name: form.name, email: form.email };
      localStorage.setItem('applyai_token', 'demo_session_token_123');
      localStorage.setItem('applyai_user', JSON.stringify(dummyUser));
      
      toast.success('Account created! Let\'s set up your profile.');
      router.push('/onboarding');
    } catch (err) {
      toast.error(err?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 bg-grid-pattern relative selection:bg-primary/20">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text font-display tracking-tight">ApplyAI</span>
          </div>
          <h1 className="text-2xl font-bold text-text mb-1 font-display">Create your account</h1>
          <p className="text-text-muted text-sm font-medium">Automate your job hunt in minutes</p>
        </div>

        {/* Card */}
        <div className="card shadow-premium border border-border animate-slide-up bg-white p-7">
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input pl-10"
                  placeholder="Alex Kumar"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                <input
                  id="register-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                <input
                  id="register-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pl-10"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              id="register-btn" 
              disabled={loading} 
              className="btn-primary w-full py-3 mt-2 font-bold justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-border" />
            <span className="text-text-subtle text-[10px] font-bold tracking-widest">OR</span>
            <hr className="flex-1 border-border" />
          </div>

          {/* Social Google OAuth Placeholder */}
          <button
            id="google-register-btn"
            onClick={() => toast('Google OAuth requires Supabase configuration', { icon: 'ℹ️' })}
            className="btn-secondary w-full py-3 justify-center gap-2.5 font-bold"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <p className="text-center text-text-muted text-xs font-semibold mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline transition-colors font-bold">
              Sign in
            </Link>
          </p>

          <p className="text-center text-text-subtle text-[10px] leading-relaxed mt-5">
            By creating an account, you agree to our <Link href="/register" className="hover:underline font-medium">Terms of Service</Link> and <Link href="/register" className="hover:underline font-medium">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
