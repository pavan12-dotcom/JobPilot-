'use client';
import { useState, useEffect, useRef } from 'react';
import { jobsApi, applicationsApi } from '@/lib/api';
import { getSourceLabel } from '@/lib/sourceLabels';

const getRoleType = (titleText) => {
  const lower = (titleText || '').toLowerCase();
  const dataKeywords = ['data', 'analyst', 'analytics', 'science', 'scientist', 'intelligence', 'ai'];
  const softwareKeywords = ['engineer', 'developer', 'software', 'backend', 'frontend', 'full stack', 'reliability', 'devops', 'builder', 'tech', 'programmer', 'sde', 'coder'];

  if (dataKeywords.some(kw => lower.includes(kw))) {
    return 'data';
  }
  if (softwareKeywords.some(kw => lower.includes(kw))) {
    return 'software';
  }
  return 'design'; // fallback
};

export default function DetailScreen({ back, showToast, selectedJob }) {
  const match = selectedJob || {};
  const job = match.job || {};
  const applyUrl = job.apply_url || '';
  const app = match.application || {};

  const [activeTab, setActiveTab] = useState('About');
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(selectedJob?.is_saved || false);
  const [logs, setLogs] = useState([]);
  const [appStatus, setAppStatus] = useState(app.status || null);
  const terminalRef = useRef(null);

  const tabs = app.id
    ? ['About', 'Requirements', 'ATS Report', 'App Logs', 'Company']
    : ['About', 'Requirements', 'ATS Report', 'Company'];

  useEffect(() => {
    if (app.id) {
      applicationsApi.getById(app.id).then((res) => {
        setLogs(res?.data?.logs || []);
        setAppStatus(res?.data?.status || app.status);
      }).catch(() => {});
    }
  }, [app.id]);

  // Auto-scroll terminal to bottom whenever new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!app.id) return;

    const handleLogAdded = (e) => {
      const { applicationId, log } = e.detail || {};
      if (applicationId === app.id && log) {
        setLogs((prev) => {
          if (prev.some((l) => l.id === log.id)) return prev;
          return [...prev, log];
        });
      }
    };

    const handleStatusUpdated = (e) => {
      const { applicationId, status } = e.detail || {};
      if (applicationId === app.id) {
        setAppStatus(status);
      }
    };

    window.addEventListener('jobpilot:application-log-added', handleLogAdded);
    window.addEventListener('jobpilot:application-status-updated', handleStatusUpdated);

    return () => {
      window.removeEventListener('jobpilot:application-log-added', handleLogAdded);
      window.removeEventListener('jobpilot:application-status-updated', handleStatusUpdated);
    };
  }, [app.id]);
  const reasons = match.match_reasons || {};
  const score = match.match_score || null;

  const title = job.title || 'Position';
  const roleType = getRoleType(title);

  const ats = reasons.ats_breakdown || null;

  const company = job.company || 'Unknown Company';
  const location = job.location || 'Remote';
  const jobType = job.job_type?.replace('_', '-') || 'Full-time';
  const description = job.description || "No description provided.";
  
  const skills = reasons.skills_matched || [];
  const skillsMissing = reasons.skills_missing || [];

  // Dynamic salary formatting helper
  const formatSalary = (min, max) => {
    if (!min) return 'Competitive';
    if (min < 100000) {
      const formattedMin = min >= 1000 ? `${(min/1000).toFixed(0)}k` : min;
      const formattedMax = max ? (max >= 1000 ? `${(max/1000).toFixed(0)}k` : max) : null;
      return formattedMax ? `$${formattedMin} – $${formattedMax}/yr` : `$${formattedMin}/yr`;
    }
    const minLakh = (min / 100000).toFixed(1).replace('.0', '');
    const maxLakh = max ? (max / 100000).toFixed(1).replace('.0', '') : (min * 1.3 / 100000).toFixed(1).replace('.0', '');
    return `₹${minLakh}L – ₹${maxLakh}L/yr`;
  };

  const formatSalarySimple = (min) => {
    if (!min) return 'Competitive';
    if (min < 100000) {
      return min >= 1000 ? `$${(min/1000).toFixed(0)}k` : `$${min}`;
    }
    return `₹${(min / 100000).toFixed(1).replace('.0', '')}L`;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);
  const salarySimple = formatSalarySimple(job.salary_min);

  // Dynamic responsibilities based on job title
  const getResponsibilities = () => {
    if (roleType === 'data') {
      return [
        { icon: 'ti-chart-bar', text: 'Analyze raw datasets to extract actionable business insights' },
        { icon: 'ti-database', text: 'Design, write, and optimize SQL dashboard reports' },
        { icon: 'ti-presentation', text: 'Present key metrics and analysis to product teams' },
        { icon: 'ti-filter', text: 'Perform data cleaning and pipeline ETL operations' },
      ];
    }
    if (roleType === 'software') {
      return [
        { icon: 'ti-code', text: 'Design, write, and maintain clean, testable, and efficient code' },
        { icon: 'ti-git-branch', text: 'Participate in code reviews, technical designs, and architecture decisions' },
        { icon: 'ti-settings', text: 'Build, maintain, and optimize robust APIs and server-side components' },
        { icon: 'ti-server', text: 'Deploy and orchestrate applications using cloud platforms and CI/CD pipelines' },
      ];
    }
    return [
      { icon: 'ti-pencil', text: 'Create high-fidelity mockups, wireframes, and interactive prototypes' },
      { icon: 'ti-users', text: 'Conduct user research sessions and translate insights into designs' },
      { icon: 'ti-palette', text: 'Define and maintain the brand design system and design tokens' },
      { icon: 'ti-arrows-split-2', text: 'Collaborate with PMs and engineers to build modern interfaces' },
    ];
  };

  const responsibilities = getResponsibilities();

  async function handleApply() {
    setApplying(true);
    try {
      await jobsApi.apply(job.id);
      showToast('🚀 Application submitted successfully!');
      if (applyUrl) {
        window.open(applyUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      showToast('🚀 Application submitted!');
      if (applyUrl) {
        window.open(applyUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setApplying(false);
    }
  }

  async function handleSave() {
    try {
      await jobsApi.save(job.id);
      setSaved(!saved);
      showToast(saved ? 'Removed from saved' : '✅ Job saved!');
    } catch {
      setSaved(!saved);
      showToast(!saved ? '✅ Job saved!' : 'Removed from saved');
    }
  }

  return (
    <div className="det-screen" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="det-topbar">
        {back ? (
          <button className="bk-btn" onClick={back}><i className="ti ti-arrow-left" /></button>
        ) : (
          <div style={{ width: 36 }} />
        )}
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Job Detail</span>
        <button className="bk-btn" onClick={handleSave}>
          <i className={`ti ${saved ? 'ti-bookmark-filled' : 'ti-bookmark'}`} style={{ color: saved ? 'var(--lime)' : undefined }} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div className="det-hero">
          <div className="det-logo">{company[0]}</div>
          <div className="det-title">{title}</div>
          <div className="det-co">{company} · {location} · {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : '2 days ago'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            {score && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', padding: '4px 12px' }}>
                <i className="ti ti-sparkles" style={{ fontSize: 12, color: 'var(--lime)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)' }}>{score}% AI Match</span>
              </div>
            )}
            {applyUrl && (
              <a 
                href={applyUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                id="view-site-button"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 5, 
                  color: 'var(--lime)', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  textDecoration: 'none',
                  background: 'rgba(225, 62, 62, 0.06)',
                  border: '1px solid rgba(225, 62, 62, 0.2)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  transition: 'all 0.2s'
                }}
              >
                <i className="ti ti-external-link" style={{ fontSize: 11 }} /> View Site
              </a>
            )}
          </div>
        </div>

        <div className="det-stats">
          <div className="dsi"><div className="dsv">{salarySimple}</div><div className="dsl">Salary</div></div>
          <div className="dsi"><div className="dsv">{jobType}</div><div className="dsl">Work type</div></div>
          <div className="dsi"><div className="dsv">{job.experience_level || 'Senior'}</div><div className="dsl">Level</div></div>
          <div className="dsi"><div className="dsv">{getSourceLabel(job.source) || 'Adzuna'}</div><div className="dsl">Source</div></div>
        </div>

        <div className="det-body">
          {/* Tabs */}
          <div className="dtabs">
            {tabs.map((t) => (
              <div key={t} className={`dtab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
            ))}
          </div>

          {/* About tab */}
          {activeTab === 'About' && (
            <div>
              <p className="about-txt">{description}</p>
              <div className="ds-title">What you'll do</div>
              {responsibilities.map(({ icon, text }) => (
                <div key={text} className="ben-row">
                  <div className="ben-ico"><i className={`ti ${icon}`} /></div>
                  <div className="ben-txt">{text}</div>
                </div>
              ))}
              <div className="sp" />
            </div>
          )}

          {/* Requirements tab */}
          {activeTab === 'Requirements' && (
            <div>
              <div className="ds-title">Skills matched by AI</div>
              <div className="req-tags" style={{ marginBottom: 16 }}>
                {skills.length > 0 ? (
                  skills.map((s) => <span key={s} className="rtag">{s}</span>)
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>No matching skills found</span>
                )}
              </div>
              {skillsMissing.length > 0 && (
                <>
                  <div className="ds-title">Nice to have</div>
                  <div className="req-tags">
                    {skillsMissing.map((s) => <span key={s} className="rtag" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80', borderColor: 'rgba(34,197,94,0.2)' }}>{s}</span>)}
                  </div>
                </>
              )}
              {reasons.summary && (
                <>
                  <div className="ds-title" style={{ marginTop: 14 }}>AI Assessment</div>
                  <p className="about-txt" style={{ fontStyle: 'italic' }}>"{reasons.summary}"</p>
                </>
              )}
              <div className="ds-title" style={{ marginTop: 14 }}>Qualifications & Requirements</div>
              <p className="about-txt">{job.requirements || "Refer to the job description for details."}</p>
              <div className="sp" />
            </div>
          )}

          {/* ATS Report tab */}
          {activeTab === 'ATS Report' && (
            <div>
              {!ats ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>
                  <i className="ti ti-chart-bar" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>No ATS Report Available</div>
                  <div style={{ fontSize: 11, maxWidth: 240, margin: '0 auto', lineHeight: 1.5 }}>
                    ATS reports are only calculated for jobs with matching data.
                  </div>
                </div>
              ) : (
                <>
                  {/* Circular Dial */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0 24px' }}>
                    <div style={{
                      position: 'relative',
                      width: 120,
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {/* SVG Circular Gauge */}
                      <svg style={{
                        transform: 'rotate(-90deg)',
                        width: 120,
                        height: 120,
                      }}>
                        {/* Background Track */}
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="transparent"
                          stroke="rgba(225, 62, 62, 0.08)"
                          strokeWidth="6"
                        />
                        {/* Dynamic Progress Circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="transparent"
                          stroke="var(--lime)"
                          strokeWidth="8"
                          strokeDasharray="326.7"
                          strokeDashoffset={326.7 - ((score || 0) / 100) * 326.7}
                          strokeLinecap="round"
                          style={{
                            filter: 'drop-shadow(0px 0px 6px rgba(225, 62, 62, 0.6))',
                            transition: 'stroke-dashoffset 0.8s ease-in-out',
                          }}
                        />
                      </svg>
                      
                      {/* Score Label inside Ring */}
                      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-1px' }}>
                          {score}<span style={{ fontSize: 14, color: 'var(--lime)', fontWeight: 700 }}>%</span>
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginTop: -2 }}>ATS Score</div>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text1)', marginTop: 14 }}>
                      {score >= 85 ? 'Highly Compatible' : score >= 70 ? 'Good Match' : 'Needs Optimization'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, textAlign: 'center', maxWidth: 280 }}>
                      {score >= 85 
                        ? 'Your resume strongly highlights the key criteria for this role.' 
                        : 'A few simple improvements could significantly boost your search rating.'}
                    </div>
                  </div>

                  {/* Breakdown metrics */}
                  <div className="ds-title">ATS Breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Keyword Match', val: ats.keyword_match ?? 0, color: 'var(--lime)' },
                      { label: 'Skills Compatibility', val: ats.skills_alignment ?? 0, color: 'var(--lime)' },
                      { label: 'Experience Match', val: ats.experience_score ?? 0, color: 'var(--lime)' },
                      { label: 'Formatting Strength', val: ats.formatting_score ?? 0, color: '#4ADE80' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text1)', marginBottom: 6 }}>
                          <span>{label}</span>
                          <span style={{ color }}>{val}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Optimization Tips */}
                  {ats.resume_optimization_tips && ats.resume_optimization_tips.length > 0 && (
                    <>
                      <div className="ds-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-sparkles" style={{ color: 'var(--lime)', fontSize: 14 }} />
                        <span>Resume Optimization Tips</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {ats.resume_optimization_tips.map((tip, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, background: 'rgba(225, 62, 62, 0.03)', border: '1px dashed rgba(225, 62, 62, 0.15)', borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--lime-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--lime)' }}>{i + 1}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text1)', lineHeight: 1.5 }}>{tip}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  <div className="sp" />
                </>
              )}
            </div>
          )}

          {/* App Logs tab */}
          {activeTab === 'App Logs' && (
            <div>
              {/* Stage progress bar */}
              <AppStageProgress status={appStatus} />

              <div className="ds-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <span>Automation Console</span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: STATUS_META[appStatus]?.color || 'var(--text3)',
                  background: STATUS_META[appStatus]?.bg || 'var(--bg2)',
                  border: `1px solid ${STATUS_META[appStatus]?.border || 'var(--border)'}`,
                  padding: '3px 10px', borderRadius: 999,
                  display: 'flex', alignItems: 'center', gap: 5
                }}>
                  {['APPLYING', 'QUEUED'].includes(appStatus) && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_META[appStatus]?.color, animation: 'ping 1.2s infinite' }} />
                  )}
                  {appStatus || 'Unknown'}
                </span>
              </div>

              {/* Terminal View */}
              <div
                ref={terminalRef}
                style={{
                  background: '#0B0B0F',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '11px',
                  color: '#D1D5DB',
                  minHeight: '220px',
                  maxHeight: '350px',
                  overflowY: 'auto',
                  boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)',
                  marginBottom: '20px',
                  scrollBehavior: 'smooth',
                }}
              >
                <div style={{ color: '#4ADE80', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', animation: ['APPLYING', 'QUEUED'].includes(appStatus) ? 'ping 1.2s infinite' : 'none' }} />
                  <span>JOBPILOT AUTOMATION CONSOLE</span>
                </div>

                {logs.length === 0 ? (
                  <div style={{ color: 'var(--text3)', fontStyle: 'italic', padding: '12px 0' }}>
                    {['APPLYING', 'QUEUED'].includes(appStatus)
                      ? 'Initializing automation engine... Log stream will start shortly.'
                      : 'No automation logs available.'}
                  </div>
                ) : (
                  <>
                    {logs.map((logLine, idx) => (
                      <div key={logLine.id || idx} style={{ marginBottom: '6px', lineHeight: '1.4' }}>
                        <span style={{ color: 'var(--lime)', marginRight: '6px' }}>&gt;</span>
                        <span style={{ color: '#888', marginRight: '6px' }}>
                          [{new Date(logLine.created_at).toLocaleTimeString()}]
                        </span>
                        <span>{logLine.event}</span>
                        {logLine.metadata && Object.keys(logLine.metadata).length > 0 && (
                          <div style={{ color: '#6B7280', fontSize: '10px', paddingLeft: '14px', marginTop: '2px' }}>
                            {JSON.stringify(logLine.metadata)}
                          </div>
                        )}
                        {logLine.screenshot_url && (
                          <div style={{ marginTop: '6px', paddingLeft: '14px' }}>
                            <img
                              src={logLine.screenshot_url}
                              alt="Log Screenshot"
                              style={{ maxWidth: '100%', borderRadius: '6px', border: '1px solid #374151' }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Blinking cursor when active */}
                    {['APPLYING', 'QUEUED'].includes(appStatus) && (
                      <div style={{ color: '#4ADE80', marginTop: 4 }}>
                        <span style={{ animation: 'blink 1s step-end infinite' }}>█</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="sp" />
            </div>
          )}

          {/* Company tab */}
          {activeTab === 'Company' && (
            <div>
              <div className="ds-title">About {company}</div>
              <p className="about-txt">{company} is offering a {title} position located in {location}.</p>
              
              <div className="ds-title" style={{ marginTop: 14 }}>Role Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  [location, 'Location'],
                  [jobType, 'Job Type'],
                  [getSourceLabel(job.source) || 'Adzuna', 'Platform Source'],
                  [job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recently', 'Posted Date']
                ].map(([v, l]) => (
                  <div key={l} style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-md)', padding: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              {applyUrl && (
                <a href={applyUrl} target="_blank" rel="noopener noreferrer" id="view-site-company-link" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--lime)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  <i className="ti ti-external-link" /> View Site
                </a>
              )}
              <div className="sp" />
            </div>
          )}
        </div>
      </div>

      {/* Apply bar */}
      <div className="apply-bar">
        <div className="sal-disp">
          <div className="sal-amt">{salarySimple}</div>
          {salarySimple !== 'Competitive' && <div className="sal-per">per year</div>}
        </div>
        <button
          className="apply-btn-full"
          onClick={handleApply}
          disabled={applying}
          style={{ opacity: applying ? 0.7 : 1 }}
        >
          {applying ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--bg)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              Submitting…
            </span>
          ) : '🚀 Apply now'}
        </button>
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes ping{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.5)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      `}</style>
    </div>
  );
}

// ── Stage Progress Bar ────────────────────────────────────────────────────────
const STAGES = [
  { key: 'queued',     label: 'Queued',     statuses: ['QUEUED', 'DRAFT'] },
  { key: 'preparing', label: 'Preparing',   statuses: ['APPLYING'] },
  { key: 'filling',   label: 'Filling',     statuses: ['READY_FOR_REVIEW'] },
  { key: 'submitting',label: 'Submitting',  statuses: ['SUBMITTED', 'APPLIED'] },
  { key: 'done',      label: 'Done',        statuses: ['SUBMITTED', 'APPLIED', 'HIRED', 'OFFER', 'INTERVIEW'] },
];

const STATUS_META = {
  QUEUED:                { color: '#93C5FD', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)' },
  DRAFT:                 { color: '#D1D5DB', bg: 'rgba(209,213,219,0.1)',  border: 'rgba(209,213,219,0.2)' },
  APPLYING:              { color: '#FCD34D', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)' },
  READY_FOR_REVIEW:      { color: '#FB923C', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.2)' },
  SUBMITTED:             { color: '#4ADE80', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.2)' },
  APPLIED:               { color: '#4ADE80', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.2)' },
  FAILED:                { color: '#FCA5A5', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)' },
  WAITING_FOR_VERIFICATION: { color: '#FDBA74', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' },
  INTERVIEW:             { color: '#86EFAC', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.2)' },
  OFFER:                 { color: '#6EE7B7', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)' },
  REJECTED:              { color: '#FCA5A5', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)' },
};

function getStageIndex(status) {
  if (!status) return -1;
  if (['FAILED', 'REJECTED', 'WITHDRAWN'].includes(status)) return -1; // failed
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (STAGES[i].statuses.includes(status)) return i;
  }
  return 0;
}

function AppStageProgress({ status }) {
  const isFailed = ['FAILED', 'REJECTED', 'WITHDRAWN', 'WAITING_FOR_VERIFICATION'].includes(status);
  const currentIdx = getStageIndex(status);

  if (!status) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      {isFailed ? (
        <div style={{
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 16 }}>{status === 'WAITING_FOR_VERIFICATION' ? '⚠️' : '❌'}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5' }}>
              {status === 'WAITING_FOR_VERIFICATION' ? 'CAPTCHA — Manual Action Required' : 'Application Failed'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Check the log below for details</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 2px' }}>
          {STAGES.map((stage, i) => {
            const isDone = i <= currentIdx;
            const isActive = i === currentIdx;
            return (
              <>
                <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: isDone ? 'var(--lime)' : 'var(--bg3)',
                    border: `2px solid ${isActive ? 'var(--lime)' : isDone ? 'var(--lime)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isActive ? '0 0 8px rgba(225,62,62,0.5)' : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}>
                    {isDone && !isActive && <span style={{ fontSize: 10, color: 'var(--bg)' }}>✓</span>}
                    {isActive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg)', animation: 'ping 1.2s infinite' }} />}
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 600, color: isDone ? 'var(--lime)' : 'var(--text3)', marginTop: 4, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {stage.label}
                  </div>
                </div>
                {i < STAGES.length - 1 && (
                  <div key={`line-${i}`} style={{
                    height: 2, flex: 1,
                    background: i < currentIdx ? 'var(--lime)' : 'var(--border)',
                    marginBottom: 18,
                    transition: 'background 0.3s ease',
                  }} />
                )}
              </>
            );
          })}
        </div>
      )}
    </div>
  );
}
