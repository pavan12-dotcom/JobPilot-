'use client';
export default function SplashScreen({ goTo }) {
  return (
    <div className="splash">
      <div className="splash-ring"><div className="inner"><i className="ti ti-briefcase" /></div></div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>JobPilot</div>
      <div className="splash-title">Find Your <em>Dream Job</em> Faster</div>
      <div className="splash-sub">58,000+ live roles matched to your skills. AI‑powered auto‑apply built for you.</div>
      <button className="splash-btn" onClick={() => goTo('login')}>Get started →</button>
      <div className="splash-skip" onClick={() => goTo('login')}>Already have an account? Sign in</div>
    </div>
  );
}
