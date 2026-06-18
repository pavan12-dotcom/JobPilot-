'use client';
import { useState, useEffect } from 'react';
import { jobsApi } from '@/lib/api';

export default function SplashScreen({ goTo }) {
  const [jobCount, setJobCount] = useState(null);

  useEffect(() => {
    jobsApi.getPublicStats()
      .then((res) => {
        if (res?.success && res.data?.total_jobs !== undefined) {
          setJobCount(res.data.total_jobs);
        }
      })
      .catch(() => {});
  }, []);

  const displayCount = jobCount !== null ? `${jobCount.toLocaleString()}+` : '58,000+';

  return (
    <div className="splash">
      <div className="splash-ring"><div className="inner"><i className="ti ti-briefcase" /></div></div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>JobPilot</div>
      <div className="splash-title">Find Your <em>Dream Job</em> Faster</div>
      <div className="splash-sub">{displayCount} live roles matched to your skills. AI‑powered auto‑apply built for you.</div>
      <button className="splash-btn" onClick={() => goTo('login')}>Get started →</button>
      <div className="splash-skip" onClick={() => goTo('login')}>Already have an account? Sign in</div>
    </div>
  );
}
