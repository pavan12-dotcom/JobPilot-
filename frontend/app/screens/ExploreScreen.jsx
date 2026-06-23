'use client';
import { useState, useEffect, useCallback } from 'react';
import { jobsApi } from '@/lib/api';
import DetailScreen from './DetailScreen';

const LOCATIONS = ['Anywhere', 'Remote', 'Hybrid', 'On-site'];
const JOB_TYPES = ['All types', 'Full-time', 'Part-time', 'Contract'];
const LEVELS = ['Any level', 'Entry', 'Mid', 'Senior'];
const TYPE_MAP = { 'All types': undefined, 'Full-time': 'FULL_TIME', 'Part-time': 'PART_TIME', 'Contract': 'CONTRACT' };
const POPULAR = ['Product Designer', 'React Developer', 'Data Analyst', 'iOS Engineer', 'DevOps', 'UX Writer'];

function scoreColor(score) {
  if (score >= 85) return '#4ADE80';
  if (score >= 70) return 'var(--lime)';
  return '#FCD34D';
}

export default function ExploreScreen({ goTo, user, showToast, setSelectedJob, selectedJob }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Anywhere');
  const [jobType, setJobType] = useState('All types');
  const [level, setLevel] = useState('Any level');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (query) params.search = query;
      if (TYPE_MAP[jobType]) params.job_type = TYPE_MAP[jobType];
      if (location === 'Remote') params.job_type = 'REMOTE';
      const res = await jobsApi.getRecommended(params);
      const list = res?.data || [];
      setJobs(list);
      setCount(list.length);
    } catch {
      setJobs([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [query, location, jobType]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Auto-refresh when backend pushes a jobs-refreshed event via WebSocket
  useEffect(() => {
    const handleRefresh = () => { loadJobs(); };
    window.addEventListener('jobpilot:jobs-refreshed', handleRefresh);
    window.addEventListener('jobpilot:stats-updated', handleRefresh);
    return () => {
      window.removeEventListener('jobpilot:jobs-refreshed', handleRefresh);
      window.removeEventListener('jobpilot:stats-updated', handleRefresh);
    };
  }, [loadJobs]);

  async function handleSave(job, btn) {
    try {
      await jobsApi.save(job.job?.id || job.id);
      showToast('Job saved!');
    } catch { showToast('Saved!'); }
  }

  const filtered = jobs.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (m.job?.title || '').toLowerCase().includes(q) || (m.job?.company || '').toLowerCase().includes(q);
  });



  return (
    <>
      <div className="topbar">
        <div className="logo">Job<span>Pilot</span></div>
        <div className="ava" onClick={() => goTo('profile')}>{(user?.name || 'AR').slice(0, 2).toUpperCase()}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {/* Search input */}
        <div className="srch-inp-wrap">
          <div className="srch-inp">
            <i className="ti ti-search" />
            <input
              type="text"
              placeholder="Job title, skill, company…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: 'var(--text1)', fontFamily: 'inherit' }}
            />
            {query && <i className="ti ti-x" style={{ fontSize: 13, color: 'var(--text3)', cursor: 'pointer' }} onClick={() => setQuery('')} />}
          </div>
        </div>

        {/* Filters */}
        {[
          { label: 'Location', items: LOCATIONS, value: location, set: setLocation },
          { label: 'Job type', items: JOB_TYPES, value: jobType, set: setJobType },
          { label: 'Experience', items: LEVELS, value: level, set: setLevel },
        ].map(({ label, items, value, set }) => (
          <div key={label} className="f-sec">
            <div className="f-lbl">{label}</div>
            <div className="f-chips">
              {items.map((item) => (
                <div key={item} className={`fchip ${value === item ? 'active' : ''}`} onClick={() => set(item)}>{item}</div>
              ))}
            </div>
          </div>
        ))}

        {/* Popular searches */}
        {!query && (
          <div className="pop-srch">
            <div className="pop-title">Popular searches</div>
            <div className="pop-tags">
              {POPULAR.map((p) => (
                <div key={p} className="ptag" onClick={() => setQuery(p)}>
                  <i className="ti ti-trending-up" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="divl" />
        <div className="res-count">
          {loading ? 'Searching…' : <><strong>{query ? filtered.length : (count ?? 0)}</strong> jobs found</>}
        </div>

        {/* Job cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text3)', fontSize: 13 }}>
            <i className="ti ti-loader" style={{ fontSize: 24, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
            Fetching matched jobs…
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((match, i) => {
            const job = match.job || match;
            const score = match.match_score;
            const saved = match.is_saved;
            const initials = (job.company || 'J').slice(0, 2);
            return (
              <div key={job.id || i} className="jcard" onClick={() => { setSelectedJob(match); goTo('detail'); }}>
                <div className="jc-row">
                  <div className="jc-logo" style={{ background: 'var(--lime-dim)', color: 'var(--lime)' }}>{initials}</div>
                  <div className="jc-inf">
                    <div className="jc-title">{job.title}</div>
                    <div className="jc-meta">{job.company} · {job.location}</div>
                  </div>
                  {score && <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor(score), background: `${scoreColor(score)}18`, border: `1px solid ${scoreColor(score)}30`, borderRadius: 'var(--radius-full)', padding: '3px 8px', flexShrink: 0 }}>{score}%</span>}
                  <button className={`jsave ${saved ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); handleSave(match); }}>
                    <i className="ti ti-bookmark" />
                  </button>
                </div>
                <div className="jc-bot">
                  <div className="tags-row">
                    <span className="jtag t-remote">{job.job_type?.replace('_', '-') || 'Remote'}</span>
                    <span className="jtag t-full">Full-time</span>
                    {match.match_reasons?.skills_matched?.[0] && <span className="jtag t-remote">{match.match_reasons.skills_matched[0]}</span>}
                  </div>
                  <div className="jc-salary">{job.salary_min ? `₹${(job.salary_min / 100000).toFixed(0)}L+` : 'Competitive'}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)', fontSize: 13 }}>
            <i className="ti ti-briefcase" style={{ fontSize: 36, display: 'block', marginBottom: 12, color: 'var(--text3)' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>No jobs found</div>
            <div style={{ maxWidth: 260, margin: '0 auto', lineHeight: 1.5 }}>
              Try adjusting your search queries or category filters to find matched positions.
            </div>
          </div>
        )}

        <div className="sp" />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
