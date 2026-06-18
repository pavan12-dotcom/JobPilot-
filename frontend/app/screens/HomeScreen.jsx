'use client';
import { useState, useEffect } from 'react';
import { dashboardApi, jobsApi } from '@/lib/api';



function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const ICON_MAP = { match: { icon: 'ti-briefcase', bg: 'var(--lime-dim)', color: 'var(--lime)' }, apply: { icon: 'ti-send', bg: 'rgba(34,197,94,0.1)', color: '#4ADE80' }, interview: { icon: 'ti-calendar', bg: 'rgba(251,191,36,0.1)', color: '#FCD34D' }, view: { icon: 'ti-eye', bg: 'rgba(96,165,250,0.1)', color: '#93C5FD' }, default: { icon: 'ti-activity', bg: 'var(--bg3)', color: 'var(--text2)' } };

export default function HomeScreen({ goTo, user, showToast, setSelectedJob }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [insights, setInsights] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const userName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    loadDashboard();

    const handleRealtimeUpdate = () => {
      loadDashboard();
    };

    window.addEventListener('jobpilot:stats-updated', handleRealtimeUpdate);
    window.addEventListener('jobpilot:job-matched', handleRealtimeUpdate);
    window.addEventListener('jobpilot:application-status-updated', handleRealtimeUpdate);

    return () => {
      window.removeEventListener('jobpilot:stats-updated', handleRealtimeUpdate);
      window.removeEventListener('jobpilot:job-matched', handleRealtimeUpdate);
      window.removeEventListener('jobpilot:application-status-updated', handleRealtimeUpdate);
    };
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [statsRes, activityRes, insightsRes, jobsRes] = await Promise.allSettled([
        dashboardApi.stats(),
        dashboardApi.activity(4),
        dashboardApi.insights(),
        jobsApi.getRecommended({ limit: 4, min_score: 70 }),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value?.data);
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value?.data || []);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value?.data?.insights || []);
      if (jobsRes.status === 'fulfilled') setTopJobs(jobsRes.value?.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await jobsApi.refresh();
      showToast('Job scan triggered! New matches incoming…');
      setTimeout(loadDashboard, 2000);
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

        {/* Autopilot banner */}
        <div style={{ margin: '0 20px 14px', background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--lime-mid)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-zap" style={{ fontSize: 16, color: 'var(--lime)' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Autopilot Active</div>
              <div style={{ fontSize: 10, color: 'var(--text2)' }}>Scoring threshold: 70%+</div>
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
              Upload your resume and adjust preferences to start receiving matching job recommendations.
            </div>
          </div>
        )}

        {/* Scan queue button */}
        <div className="sec-hd">
          <span className="sec-title">Recent Activity</span>
          <span className="see-all" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className={`ti ti-refresh ${refreshing ? 'spinning' : ''}`} style={{ fontSize: 11 }} />
            {refreshing ? 'Scanning…' : 'Scan Queue'}
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
      <style>{`@keyframes ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} } .spinning{animation:spin 0.8s linear infinite} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
