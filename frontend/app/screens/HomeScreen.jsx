'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { dashboardApi, jobsApi } from '@/lib/api';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function formatCountdown(ms) {
  if (ms <= 0) return '0:00';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const ICON_MAP = {
  match: { icon: 'ti-briefcase', bg: 'var(--lime-dim)', color: 'var(--lime)' },
  apply: { icon: 'ti-send', bg: 'rgba(34,197,94,0.1)', color: '#4ADE80' },
  interview: { icon: 'ti-calendar', bg: 'rgba(251,191,36,0.1)', color: '#FCD34D' },
  view: { icon: 'ti-eye', bg: 'rgba(96,165,250,0.1)', color: '#93C5FD' },
  default: { icon: 'ti-activity', bg: 'var(--bg3)', color: 'var(--text2)' },
};

export default function HomeScreen({ goTo, user, showToast, setSelectedJob }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [insights, setInsights] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  // Real-time state
  const [lastUpdated, setLastUpdated] = useState(null);       // Date of last successful fetch
  const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL_MS); // ms until next auto-refresh
  const [newJobsBanner, setNewJobsBanner] = useState(null);   // { count, timestamp } or null

  const nextRefreshAt = useRef(Date.now() + REFRESH_INTERVAL_MS);
  const autoRefreshTimer = useRef(null);
  const countdownTimer = useRef(null);

  const userName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // ── Load dashboard data ──────────────────────────────────────────────────────
  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, activityRes, insightsRes, jobsRes] = await Promise.allSettled([
        dashboardApi.stats(),
        dashboardApi.activity(4),
        dashboardApi.insights(),
        jobsApi.getRecommended({ limit: 4, min_score: 30 }),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value?.data);
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value?.data || []);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value?.data?.insights || []);
      if (jobsRes.status === 'fulfilled') setTopJobs(jobsRes.value?.data || []);
      setLastUpdated(new Date());
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── Schedule the next hourly auto-refresh ────────────────────────────────────
  const scheduleNextRefresh = useCallback(() => {
    if (autoRefreshTimer.current) clearTimeout(autoRefreshTimer.current);
    nextRefreshAt.current = Date.now() + REFRESH_INTERVAL_MS;
    setNextRefreshIn(REFRESH_INTERVAL_MS);

    autoRefreshTimer.current = setTimeout(async () => {
      // Silently trigger a backend job-fetch then reload dashboard
      try {
        await jobsApi.refresh();
      } catch (_) { /* non-fatal */ }
      await loadDashboard(true);
      setLastUpdated(new Date());
      showToast('🔄 Jobs refreshed automatically!');
      scheduleNextRefresh(); // reschedule
    }, REFRESH_INTERVAL_MS);
  }, [loadDashboard, showToast]);

  // ── Live countdown ticker ────────────────────────────────────────────────────
  useEffect(() => {
    countdownTimer.current = setInterval(() => {
      const remaining = nextRefreshAt.current - Date.now();
      setNextRefreshIn(Math.max(0, remaining));
    }, 1000);
    return () => clearInterval(countdownTimer.current);
  }, []);

  // ── Initial load + schedule ──────────────────────────────────────────────────
  useEffect(() => {
    loadDashboard();
    scheduleNextRefresh();
    return () => {
      if (autoRefreshTimer.current) clearTimeout(autoRefreshTimer.current);
    };
  }, []);

  // ── WebSocket real-time events ───────────────────────────────────────────────
  useEffect(() => {
    const handleJobsRefreshed = (e) => {
      const { newMatches = 0, newJobs = 0 } = e.detail || {};
      // Show banner if there are new items
      if (newMatches > 0 || newJobs > 0) {
        setNewJobsBanner({ newMatches, newJobs, timestamp: Date.now() });
      }
      // Silently reload the dashboard
      loadDashboard(true);
      setLastUpdated(new Date());
      // Reset the countdown since we just got fresh data
      nextRefreshAt.current = Date.now() + REFRESH_INTERVAL_MS;
      setNextRefreshIn(REFRESH_INTERVAL_MS);
    };

    const handleStatsUpdated = () => {
      loadDashboard(true);
      setLastUpdated(new Date());
    };

    const handleJobMatched = (e) => {
      const { score, job } = e.detail || {};
      if (job) {
        showToast(`🎯 New match: ${score}% — ${job.title} at ${job.company}!`);
      }
      loadDashboard(true);
    };

    const handleStatusUpdated = (e) => {
      const { status, application } = e.detail || {};
      const job = application?.job || {};
      if (job?.title) {
        showToast(`🚀 Status updated: ${status} for ${job.title}`);
      }
      loadDashboard(true);
    };

    window.addEventListener('jobpilot:jobs-refreshed', handleJobsRefreshed);
    window.addEventListener('jobpilot:stats-updated', handleStatsUpdated);
    window.addEventListener('jobpilot:job-matched', handleJobMatched);
    window.addEventListener('jobpilot:application-status-updated', handleStatusUpdated);

    return () => {
      window.removeEventListener('jobpilot:jobs-refreshed', handleJobsRefreshed);
      window.removeEventListener('jobpilot:stats-updated', handleStatsUpdated);
      window.removeEventListener('jobpilot:job-matched', handleJobMatched);
      window.removeEventListener('jobpilot:application-status-updated', handleStatusUpdated);
    };
  }, [loadDashboard, showToast]);

  // ── Manual refresh (Scan Queue button) ──────────────────────────────────────
  async function handleRefresh() {
    setRefreshing(true);
    try {
      await jobsApi.refresh();
      showToast('⚡ Job scan triggered! New matches incoming…');
      setTimeout(() => {
        loadDashboard(true);
        scheduleNextRefresh();
      }, 2500);
    } catch {
      showToast('Set preferences first to fetch jobs.');
    } finally {
      setRefreshing(false);
    }
  }

  const s = stats ?? {};
  const featured = topJobs[0];

  return (
    <>
      <div className="topbar">
        <div className="logo">Job<span>Pilot</span></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="ibtn" onClick={() => goTo('notifications')}><i className="ti ti-bell" /></div>
          <div className="ava" onClick={() => goTo('profile')}>{(user?.name || 'AR').slice(0, 2).toUpperCase()}</div>
        </div>
      </div>

      {/* New Jobs Banner */}
      {newJobsBanner && (
        <div
          style={{
            margin: '0 20px 0',
            background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(163,230,53,0.1))',
            border: '1px solid rgba(74,222,128,0.35)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'slideDown 0.4s ease',
            cursor: 'pointer',
          }}
          onClick={() => { setNewJobsBanner(null); goTo('search'); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🆕</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80' }}>
                {newJobsBanner.newMatches > 0
                  ? `${newJobsBanner.newMatches} new job match${newJobsBanner.newMatches !== 1 ? 'es' : ''} found!`
                  : `${newJobsBanner.newJobs} new jobs added!`}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text2)' }}>Tap to explore →</div>
            </div>
          </div>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: 4 }}
            onClick={(e) => { e.stopPropagation(); setNewJobsBanner(null); }}
          >✕</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {/* Hero */}
        <div className="hero-sec">
          <div className="hero-greet">{greeting}, {userName} 👋</div>
          <div className="hero-h">Find your <em>dream job</em><br />today</div>
          <div className="hero-sub">Autopilot is active. Matching jobs to your skills 24/7.</div>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <div className="search-bar" onClick={() => goTo('search')}>
            <i className="ti ti-search" />
            <span>Search jobs, skills, companies…</span>
            <div className="search-flt"><i className="ti ti-adjustments-horizontal" /></div>
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          {[
            { num: s.total_applied || 0, lbl: 'Applied' },
            { num: s.interviews || 0, lbl: 'Interviews' },
            { num: `${s.success_rate || 0}%`, lbl: 'Success' },
            { num: s.jobs_matched_today || 0, lbl: 'Matched' },
          ].map(({ num, lbl }) => (
            <div key={lbl} className="stat-card">
              <div className="stat-num">{loading ? '—' : num}</div>
              <div className="stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Autopilot banner with live countdown */}
        <div style={{ margin: '0 20px 14px', background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--lime-mid)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-zap" style={{ fontSize: 16, color: 'var(--lime)' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Autopilot Active</div>
              <div style={{ fontSize: 10, color: 'var(--text2)' }}>
                {lastUpdated
                  ? `Updated ${timeAgo(lastUpdated)} · Next in ${formatCountdown(nextRefreshIn)}`
                  : `Next refresh in ${formatCountdown(nextRefreshIn)}`}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#4ADE80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.15)', padding: '4px 10px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, background: '#4ADE80', borderRadius: '50%', animation: 'ping 1s infinite' }} />
            Running
          </span>
        </div>

        {/* Categories */}
        <div className="sec-hd"><span className="sec-title">Categories</span></div>
        <div className="cats">
          {['All', 'Design', 'Engineering', 'Data', 'Marketing', 'Product'].map((cat) => (
            <div key={cat} className={`cat ${cat === activeCategory ? 'active' : 'off'}`} onClick={() => setActiveCategory(cat)}>{cat}</div>
          ))}
        </div>

        {/* Featured job */}
        <div className="sec-hd">
          <span className="sec-title">Featured Match</span>
          <span className="see-all" onClick={() => goTo('search')}>See all</span>
        </div>
        {featured ? (
          <div className="feat-card" onClick={() => { setSelectedJob(featured); goTo('detail'); }}>
            <div className="fc-top">
              <div className="fc-logo">{(featured.job?.company || 'G')[0]}</div>
              <div className="fc-badge">{featured.match_score ? `${featured.match_score}% Match` : 'Featured'}</div>
            </div>
            <div className="fc-title">{featured.job?.title || 'Job Title'}</div>
            <div className="fc-co">{featured.job?.company || 'Company'} · {featured.job?.location || 'Location'}</div>
            <div className="fc-tags">
              <div className="fc-tag">{featured.job?.job_type?.replace('_', '-') || 'Remote'}</div>
              <div className="fc-tag">Full-time</div>
              {featured.match_reasons?.skills_matched?.slice(0, 1).map((s) => <div key={s} className="fc-tag">{s}</div>)}
            </div>
            <div className="fc-bot">
              <div className="fc-salary">{featured.job?.salary_min ? `₹${(featured.job.salary_min / 100000).toFixed(0)}L+` : '$120k – $160k/yr'}</div>
              <button className="fc-apply" onClick={(e) => { e.stopPropagation(); jobsApi.apply(featured.job?.id).then(() => showToast('Application submitted!')).catch(() => showToast('Applied!')); }}>Apply now</button>
            </div>
          </div>
        ) : (
          <div className="feat-card" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 150, border: '1.5px dashed var(--border2)', background: 'transparent', boxShadow: 'none' }} onClick={(e) => e.stopPropagation()}>
            <i className="ti ti-briefcase" style={{ fontSize: 28, color: 'var(--text3)', marginBottom: 8 }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>No Job Matches Yet</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
              Upload your resume and set preferences to start receiving matching job recommendations.
            </div>
          </div>
        )}

        {/* Scan queue / Recent Activity header */}
        <div className="sec-hd">
          <span className="sec-title">Recent Activity</span>
          <span className="see-all" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className={`ti ti-refresh ${refreshing ? 'spinning' : ''}`} style={{ fontSize: 11 }} />
            {refreshing ? 'Scanning…' : 'Scan Now'}
          </span>
        </div>

        {/* Activity feed */}
        <div style={{ margin: '0 20px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {activity.length > 0 ? (
            activity.slice(0, 4).map((act, i) => {
              const type = act.type || 'default';
              const ic = ICON_MAP[type] || ICON_MAP.default;
              return (
                <div key={act.id || i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderBottom: i < activity.length - 1 && i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${ic.icon}`} style={{ fontSize: 14, color: ic.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text1)', fontWeight: 600, lineHeight: 1.4 }}>{act.message || act.description || act.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{timeAgo(act.created_at || act.timestamp)}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ display: 'flex', gap: 12, padding: '20px 14px', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
              <i className="ti ti-activity" style={{ fontSize: 24, color: 'var(--text3)' }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>No Activity Yet</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, maxWidth: 240, lineHeight: 1.4 }}>Match notifications and submissions will be displayed here.</div>
              </div>
            </div>
          )}
        </div>

        {/* AI insights */}
        {insights.length > 0 && (
          <div style={{ margin: '0 20px 14px', background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-bulb" /> AI Insights
            </div>
            {insights.slice(0, 2).map((ins, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: i < insights.length - 1 ? 6 : 0 }}>
                — "{ins.message}"
              </div>
            ))}
          </div>
        )}

        <div className="sp" />
      </div>

      <style>{`
        @keyframes ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .spinning { animation: spin 0.8s linear infinite }
      `}</style>
    </>
  );
}
