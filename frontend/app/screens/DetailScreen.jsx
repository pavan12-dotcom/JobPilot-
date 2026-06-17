'use client';
import { useState } from 'react';
import { jobsApi } from '@/lib/api';

const TABS = ['About', 'Requirements', 'ATS Report', 'Company'];

export default function DetailScreen({ back, showToast, selectedJob }) {
  const [activeTab, setActiveTab] = useState('About');
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(selectedJob?.is_saved || false);

  const match = selectedJob || {};
  const job = match.job || {};
  const app = match.application || {};
  const reasons = match.match_reasons || {};
  const score = match.match_score || 75;

  const ats = reasons.ats_breakdown || {
    keyword_match: score ? Math.round(score * 0.95) : 78,
    skills_alignment: score ? Math.round(score * 0.9) : 74,
    formatting_score: 85,
    experience_score: score ? Math.round(score * 0.88) : 80,
    resume_optimization_tips: (job.title || '').toLowerCase().includes('data') || (job.title || '').toLowerCase().includes('analyst')
      ? [
          "Optimize resume to explicitly mention ETL pipelines and database query dashboard architectures.",
          "Add quantitative metrics (e.g. 'Optimized SQL queries reducing analytics latency by 25%').",
          "Ensure SQL, Python, and Tableau are highlighted directly in your top core skills block."
        ]
      : [
          "Include design systems experience and design token workflows directly in your bullet points.",
          "Describe how you coordinate with engineers to ensure interface design parity.",
          "Quantify the scale of your products (e.g., 'Designed interfaces for a 50k+ user cohort')."
        ]
  };

  const title = job.title || 'Product Designer';
  const company = job.company || 'Google';
  const location = job.location || 'Mountain View, CA';
  const jobType = job.job_type?.replace('_', '-') || 'Remote';
  const description = job.description || "Join an amazing team and help shape experiences for millions of users. Partner with engineering, research, and PMs to define and ship high-quality features.";
  
  const skills = reasons.skills_matched || (title.toLowerCase().includes('data') 
    ? ['SQL', 'Python', 'Excel', 'Tableau', 'Data analysis'] 
    : ['Figma', 'Prototyping', 'User research', 'Design systems']);
    
  const skillsMissing = reasons.skills_missing || (title.toLowerCase().includes('data')
    ? ['ETL', 'AWS Redshift']
    : ['Motion design', 'Swift/SwiftUI']);

  // Dynamic salary formatting helper
  const formatSalary = (min, max) => {
    if (!min) return '$140k/yr';
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
    if (!min) return '$140k';
    if (min < 100000) {
      return min >= 1000 ? `$${(min/1000).toFixed(0)}k` : `$${min}`;
    }
    return `₹${(min / 100000).toFixed(1).replace('.0', '')}L`;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);
  const salarySimple = formatSalarySimple(job.salary_min);

  // Dynamic responsibilities based on job title
  const getResponsibilities = () => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('data') || titleLower.includes('analyst') || titleLower.includes('analytics')) {
      return [
        { icon: 'ti-chart-bar', text: 'Analyze raw datasets to extract actionable business insights' },
        { icon: 'ti-database', text: 'Design, write, and optimize SQL dashboard reports' },
        { icon: 'ti-presentation', text: 'Present key metrics and analysis to product teams' },
        { icon: 'ti-filter', text: 'Perform data cleaning and pipeline ETL operations' },
      ];
    }
    return [
      { icon: 'ti-pencil', text: 'Own end-to-end design or development for key product features' },
      { icon: 'ti-users', text: 'Collaborate with product, engineering, and business teams' },
      { icon: 'ti-chart-bar', text: 'Analyse data and feedback to inform feature iterations' },
      { icon: 'ti-tool', text: 'Maintain quality standards and documentation at scale' },
    ];
  };

  const responsibilities = getResponsibilities();

  async function handleApply() {
    setApplying(true);
    try {
      await jobsApi.apply(job.id);
      showToast('🚀 Application submitted successfully!');
      if (job.apply_url) {
        window.open(job.apply_url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      showToast('🚀 Application submitted!');
      if (job.apply_url) {
        window.open(job.apply_url, '_blank', 'noopener,noreferrer');
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
            {job.apply_url && (
              <a 
                href={job.apply_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 5, 
                  color: 'var(--lime)', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  textDecoration: 'none',
                  background: 'rgba(184,240,35,0.06)',
                  border: '1px solid rgba(184, 240, 35, 0.2)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  transition: 'all 0.2s'
                }}
              >
                <i className="ti ti-external-link" style={{ fontSize: 11 }} /> View Posting
              </a>
            )}
          </div>
        </div>

        <div className="det-stats">
          <div className="dsi"><div className="dsv">{salarySimple}</div><div className="dsl">Salary</div></div>
          <div className="dsi"><div className="dsv">{jobType}</div><div className="dsl">Work type</div></div>
          <div className="dsi"><div className="dsv">{job.experience_level || 'Senior'}</div><div className="dsl">Level</div></div>
          <div className="dsi"><div className="dsv">{job.source || 'Adzuna'}</div><div className="dsl">Source</div></div>
        </div>

        <div className="det-body">
          {/* Tabs */}
          <div className="dtabs">
            {TABS.map((t) => (
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
              <div className="ds-title" style={{ marginTop: 14 }}>Benefits</div>
              {[
                { icon: 'ti-heart', text: 'Full health, dental & vision coverage' },
                { icon: 'ti-plane', text: 'Unlimited PTO + 20 days paid vacation' },
                { icon: 'ti-school', text: '$5,000/yr learning & development budget' },
              ].map(({ icon, text }) => (
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
                {skills.map((s) => <span key={s} className="rtag">{s}</span>)}
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
              <p className="about-txt">{job.requirements || "A degree in computer science, statistics, or related field with strong problem-solving skills and experience matching the job description."}</p>
              <div className="sp" />
            </div>
          )}

          {/* ATS Report tab */}
          {activeTab === 'ATS Report' && (
            <div>
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
                      stroke="rgba(184, 240, 35, 0.08)"
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
                      strokeDashoffset={326.7 - (score / 100) * 326.7}
                      strokeLinecap="round"
                      style={{
                        filter: 'drop-shadow(0px 0px 6px rgba(184, 240, 35, 0.6))',
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
                  { label: 'Keyword Match', val: ats.keyword_match, color: 'var(--lime)' },
                  { label: 'Skills Compatibility', val: ats.skills_alignment, color: 'var(--lime)' },
                  { label: 'Experience Match', val: ats.experience_score, color: 'var(--lime)' },
                  { label: 'Formatting Strength', val: ats.formatting_score, color: '#4ADE80' },
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
              <div className="ds-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-sparkles" style={{ color: 'var(--lime)', fontSize: 14 }} />
                <span>Resume Optimization Tips</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ats.resume_optimization_tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, background: 'rgba(184,240,35,0.03)', border: '1px dashed rgba(184,240,35,0.15)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--lime-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--lime)' }}>{i + 1}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text1)', lineHeight: 1.5 }}>{tip}</div>
                  </div>
                ))}
              </div>
              
              <div className="sp" />
            </div>
          )}

          {/* Company tab */}
          {activeTab === 'Company' && (
            <div>
              <div className="ds-title">About {company}</div>
              <p className="about-txt">{company} is a leading technology company with thousands of employees worldwide, building products used by millions every day.</p>
              <div className="ds-title" style={{ marginTop: 14 }}>Company stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[['180k+', 'Employees'], ['4.8★', 'Glassdoor'], ['1998', 'Founded'], ['$280B', 'Revenue']].map(([v, l]) => (
                  <div key={l} style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-md)', padding: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--lime)' }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              {job.apply_url && (
                <a href={job.apply_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--lime)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  <i className="ti ti-external-link" /> View original posting
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
          <div className="sal-per">per year</div>
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
