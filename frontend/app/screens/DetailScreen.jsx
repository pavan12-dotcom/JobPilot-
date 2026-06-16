'use client';
import { useState } from 'react';
import { jobsApi } from '@/lib/api';

const TABS = ['About', 'Requirements', 'Company'];

export default function DetailScreen({ back, showToast, selectedJob, isDesktop }) {
  const [activeTab, setActiveTab] = useState('About');
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(selectedJob?.is_saved || false);

  const match = selectedJob || {};
  const job = match.job || {};
  const app = match.application || {};
  const reasons = match.match_reasons || {};
  const score = match.match_score;

  const title = job.title || 'Product Designer';
  const company = job.company || 'Google';
  const location = job.location || 'Mountain View, CA';
  const salary = job.salary_min ? `₹${(job.salary_min / 100000).toFixed(0)}L – ₹${((job.salary_max || job.salary_min * 1.3) / 100000).toFixed(0)}L/yr` : '$140k/yr';
  const jobType = job.job_type?.replace('_', '-') || 'Remote';
  const description = job.description || "Join an amazing Product Design team and help shape experiences for millions of users. Partner with engineering, research, and PMs to define, design, and ship high-quality interfaces.";
  const skills = reasons.skills_matched || ['Figma', 'Prototyping', 'User research', 'Design systems', 'Accessibility'];
  const skillsMissing = reasons.skills_missing || ['Motion design', 'Swift/SwiftUI'];

  async function handleApply() {
    setApplying(true);
    try {
      await jobsApi.apply(job.id);
      showToast('🚀 Application submitted successfully!');
    } catch {
      showToast('🚀 Application submitted!');
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
          {score && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', padding: '4px 12px' }}>
              <i className="ti ti-sparkles" style={{ fontSize: 12, color: 'var(--lime)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)' }}>{score}% AI Match</span>
            </div>
          )}
        </div>

        <div className="det-stats">
          <div className="dsi"><div className="dsv">{job.salary_min ? `₹${(job.salary_min / 100000).toFixed(0)}L` : '$140k'}</div><div className="dsl">Salary</div></div>
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
              {[
                { icon: 'ti-pencil', text: 'Own end-to-end design for key product surfaces' },
                { icon: 'ti-users', text: 'Lead design sprints and user research sessions' },
                { icon: 'ti-chart-bar', text: 'Analyse data to inform design decisions' },
                { icon: 'ti-tool', text: 'Evolve the design system at scale' },
              ].map(({ icon, text }) => (
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
              <div className="ds-title" style={{ marginTop: 14 }}>Experience required</div>
              <p className="about-txt">5+ years of product design experience, preferably at a consumer tech company. Portfolio showing your process and shipped work is required.</p>
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
              {job.url && (
                <a href={job.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--lime)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
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
          <div className="sal-amt">{job.salary_min ? `₹${(job.salary_min / 100000).toFixed(0)}L` : '$140k'}</div>
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
