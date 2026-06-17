'use client';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { signInWithGoogle } from '@/lib/supabase';

export default function LoginScreen({ goTo, setUser }) {
  const [email, setEmail] = useState('demo@applyai.dev');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.login(email, password);
      const { token, user } = data.data;
      localStorage.setItem('applyai_token', token);
      localStorage.setItem('applyai_user', JSON.stringify(user));
      setUser(user);
      // Check if onboarding is needed
      const hasResume = localStorage.getItem('applyai_onboarded');
      goTo(hasResume ? 'home' : 'onboarding');
    } catch (err) {
      setError(err?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 24px 24px' }}>
      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: 32, height: 32, background: 'var(--lime)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-zap" style={{ fontSize: 16, color: 'var(--bg)' }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.5px' }}>JobPilot</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Sign in to your account</div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>AI‑powered job automation platform</div>
      </div>

      {/* Demo banner */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20, fontSize: 11 }}>
        <div style={{ color: 'var(--lime)', fontWeight: 700, marginBottom: 3 }}>🎯 Demo Credentials</div>
        <div style={{ color: 'var(--text2)' }}>Email: <span style={{ color: 'var(--text1)', fontFamily: 'monospace' }}>demo@jobpilot.dev</span></div>
        <div style={{ color: 'var(--text2)' }}>Password: <span style={{ color: 'var(--text1)', fontFamily: 'monospace' }}>demo123</span></div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#F87171' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Email</div>
          <div style={{ position: 'relative' }}>
            <i className="ti ti-mail" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text2)' }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@domain.com"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '11px 16px 11px 38px', color: 'var(--text1)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Password</div>
          <div style={{ position: 'relative' }}>
            <i className="ti ti-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text2)' }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '11px 16px 11px 38px', color: 'var(--text1)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', background: loading ? 'var(--bg3)' : 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '14px', borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? (
            <>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--bg)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              Verifying…
            </>
          ) : (
            <>Sign In <i className="ti ti-chevron-right" style={{ fontSize: 12 }} /></>
          )}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>OR</span>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          try {
            setLoading(true);
            setError('');
            await signInWithGoogle();
          } catch (err) {
            setError(err.message || 'Google Sign-In failed.');
          } finally {
            setLoading(false);
          }
        }}
        style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '12px 16px', color: 'var(--text1)', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1 }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', marginTop: 16 }}>
        New to JobPilot?{' '}
        <span onClick={() => goTo('onboarding')} style={{ color: 'var(--lime)', fontWeight: 700, cursor: 'pointer' }}>
          Create free account
        </span>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
