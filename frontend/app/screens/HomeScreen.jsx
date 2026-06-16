'use client';
import { useState, useEffect } from 'react';
import { dashboardApi, jobsApi } from '@/lib/api';

const DEMO_STATS = { total_applied: 23, interviews: 4, success_rate: 17, jobs_matched_today: 12, applied_today: 5 };
const DEMO_ACTIVITY = [
  { id: 1, type: 'match', message: 'New 94% match: Product Designer at Google', created_at: new Date(Date.now() - 120000).toISOString() },
  { id: 2, type: 'apply', message: 'Auto-applied to Frontend Engineer at Netflix', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, type: 'interview', message: 'Interview scheduled with Spotify — June 20', created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 4, type: 'view', message: '12 recruiters viewed your profile this week', created_at: new Date(Date.now() - 86400000).toISOString() },
];

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const ICON_MAP = { match: { icon: 'ti-briefcase', bg: 'var(--lime-dim)', color: 'var(--lime)' }, apply: { icon: 'ti-send', bg: 'rgba(34,197,94,0.1)', color: '#4ADE80' }, interview: { icon: 'ti-calendar', bg: 'rgba(251,191,36,0.1)', color: '#FCD34D' }, view: { icon: 'ti-eye', bg: 'rgba(96,165,250,0.1)', color: '#93C5FD' }, default: { icon: 'ti-activity', bg: 'var(--bg3)', color: 'var(--text2)' } };

export default function HomeScreen({ goTo, user, showToast, setSelectedJob, isDesktop }) {
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

  const s = stats || DEMO_STATS;
  const acts = activity.length > 0 ? activity : DEMO_ACTIVITY;
  const featured = topJobs[0];

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Main Dashboard Column */}
        <div style={{ flex: 1.6, overflowY: 'auto', padding: '24px', borderRight: '1px solid var(--border)' }}>
          {/* Greeting */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4 }}>{greeting}, {userName} 👋</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text1)', lineHeight: 1.2 }}>Find your <span style={{ color: 'var(--lime)', fontStyle: 'normal' }}>dream job</span> today</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>Autopilot is active. Matching jobs to your skills 24/7.</p>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: 24 }}>
            <div className="search-bar" onClick={() => goTo('search')}>
              <i className="ti ti-search" />
              <span>Search jobs, skills, companies…</span>
              <div className="search-flt"><i className="ti ti-adjustments-horizontal" /></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { num: s.total_applied || 0, lbl: 'Applied' },
              { num: s.interviews || 0, lbl: 'Interviews' },
              { num: `${s.success_rate || 0}%`, lbl: 'Success' },
              { num: s.jobs_matched_today || 0, lbl: 'Matched' },
            ].map(({ num, lbl }) => (
              <div key={lbl} className="stat-card" style={{ padding: '20px 10px' }}>
                <div className="stat-num" style={{ fontSize: 24 }}>{loading ? '—' : num}</div>
                <div className="stat-lbl" style={{ fontSize: 11, marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Autopilot active banner */}
          <div style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'var(--lime-mid)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-zap" style={{ fontSize: 18, color: 'var(--lime)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Autopilot Active</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Scoring threshold: 70%+ · Applying automatically</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.15)', padding: '6px 14px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: '#4ADE80', borderRadius: '50%', animation: 'ping 1s infinite' }} />
              Running
            </span>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: 24 }}>
            <div className="sec-hd" style={{ paddingLeft: 0, paddingRight: 0 }}><span className="sec-title">Categories</span></div>
            <div className="cats" style={{ paddingLeft: 0, paddingRight: 0 }}>
              {['All', 'Design', 'Engineering', 'Data', 'Marketing', 'Product'].map((cat) => (
                <div key={cat} className={`cat ${cat === activeCategory ? 'active' : 'off'}`} onClick={() => setActiveCategory(cat)}>{cat}</div>
              ))}
            </div>
          </div>

          {/* Featured job */}
          <div>
            <div className="sec-hd" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <span className="sec-title" style={{ fontSize: 16 }}>Featured Match</span>
              <span className="see-all" style={{ fontSize: 12 }} onClick={() => goTo('search')}>See all</span>
            </div>
            {featured ? (
              <div className="feat-card" style={{ margin: 0, padding: 24 }} onClick={() => { setSelectedJob(featured); goTo('search'); }}>
                <div className="fc-top">
                  <div className="fc-logo" style={{ width: 52, height: 52, fontSize: 20 }}>{(featured.job?.company || 'G')[0]}</div>
                  <div className="fc-badge" style={{ padding: '6px 12px', fontSize: 11 }}>{featured.match_score ? `${featured.match_score}% Match` : 'Featured'}</div>
                </div>
                <div className="fc-title" style={{ fontSize: 22, marginTop: 8 }}>{featured.job?.title || 'Product Designer'}</div>
                <div className="fc-co" style={{ fontSize: 14 }}>{featured.job?.company || 'Google'} · {featured.job?.location || 'Remote'}</div>
                <div className="fc-tags" style={{ margin: '14px 0' }}>
                  <div className="fc-tag" style={{ padding: '5px 12px', fontSize: 11 }}>{featured.job?.job_type?.replace('_', '-') || 'Remote'}</div>
                  <div className="fc-tag" style={{ padding: '5px 12px', fontSize: 11 }}>Full-time</div>
                  {featured.match_reasons?.skills_matched?.slice(0, 3).map((s) => <div key={s} className="fc-tag" style={{ padding: '5px 12px', fontSize: 11 }}>{s}</div>)}
                </div>
                <div className="fc-bot" style={{ marginTop: 20 }}>
                  <div className="fc-salary" style={{ fontSize: 20 }}>{featured.job?.salary_min ? `₹${(featured.job.salary_min / 100000).toFixed(0)}L+` : '$120k – $160k/yr'}</div>
                  <button className="fc-apply" style={{ padding: '10px 24px', fontSize: 13 }} onClick={(e) => { e.stopPropagation(); jobsApi.apply(featured.job?.id).then(() => showToast('Application submitted!')).catch(() => showToast('Applied!')); }}>Apply now</button>
                </div>
              </div>
            ) : (
              <div className="feat-card" style={{ margin: 0, padding: 24 }} onClick={() => goTo('search')}>
                <div className="fc-top"><div className="fc-logo" style={{ width: 52, height: 52, fontSize: 20 }}>G</div><div className="fc-badge" style={{ padding: '6px 12px', fontSize: 11 }}>Featured</div></div>
                <div className="fc-title" style={{ fontSize: 22, marginTop: 8 }}>Product Designer</div>
                <div className="fc-co" style={{ fontSize: 14 }}>Google · Mountain View, CA</div>
                <div className="fc-tags" style={{ margin: '14px 0' }}><div className="fc-tag" style={{ padding: '5px 12px', fontSize: 11 }}>Remote</div><div className="fc-tag" style={{ padding: '5px 12px', fontSize: 11 }}>Full-time</div><div className="fc-tag" style={{ padding: '5px 12px', fontSize: 11 }}>Senior</div></div>
                <div className="fc-bot" style={{ marginTop: 20 }}>
                  <div className="fc-salary" style={{ fontSize: 20 }}>$120k – $160k/yr</div>
                  <button className="fc-apply" style={{ padding: '10px 24px', fontSize: 13 }} onClick={(e) => { e.stopPropagation(); showToast('Application submitted!'); }}>Apply now</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Dashboard Column (Activity & Insights) */}
        <div style={{ flex: 0.9, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Recent Activity Card */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1)' }}>Recent Activity</span>
              <span className="see-all" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className={`ti ti-refresh ${refreshing ? 'spinning' : ''}`} style={{ fontSize: 12 }} />
                {refreshing ? 'Scanning…' : 'Scan'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>
              {acts.map((act, i) => {
                const type = act.type || 'default';
                const ic = ICON_MAP[type] || ICON_MAP.default;
                return (
                  <div key={act.id || i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${ic.icon}`} style={{ fontSize: 16, color: ic.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text1)', fontWeight: 600, lineHeight: 1.4 }}>{act.message || act.description || act.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{timeAgo(act.created_at || act.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insights Card */}
          {insights.length > 0 && (
            <div style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lime)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-bulb" /> AI Recommendation Insights
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {insights.slice(0, 3).map((ins, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic' }}>
                    — "{ins.message}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <style>{`@keyframes ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} } .spinning{animation:spin 0.8s linear infinite} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

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
            <div className="fc-title">{featured.job?.title || 'Product Designer'}</div>
            <div className="fc-co">{featured.job?.company || 'Google'} · {featured.job?.location || 'Remote'}</div>
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
          <div className="feat-card" onClick={() => goTo('detail')}>
            <div className="fc-top"><div className="fc-logo">G</div><div className="fc-badge">Featured</div></div>
            <div className="fc-title">Product Designer</div>
            <div className="fc-co">Google · Mountain View, CA</div>
            <div className="fc-tags"><div className="fc-tag">Remote</div><div className="fc-tag">Full-time</div><div className="fc-tag">Senior</div></div>
            <div className="fc-bot">
              <div className="fc-salary">$120k – $160k/yr</div>
              <button className="fc-apply" onClick={(e) => { e.stopPropagation(); showToast('Application submitted!'); }}>Apply now</button>
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
          {acts.slice(0, 4).map((act, i) => {
            const type = act.type || 'default';
            const ic = ICON_MAP[type] || ICON_MAP.default;
            return (
              <div key={act.id || i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${ic.icon}`} style={{ fontSize: 14, color: ic.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text1)', fontWeight: 600, lineHeight: 1.4 }}>{act.message || act.description || act.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{timeAgo(act.created_at || act.timestamp)}</div>
                </div>
              </div>
            );
          })}
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
