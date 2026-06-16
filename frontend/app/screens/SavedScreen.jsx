'use client';
import { useState, useEffect } from 'react';
import { applicationsApi } from '@/lib/api';
import DetailScreen from './DetailScreen';

const STATUS_FILTERS = ['All', 'New', 'Applied', 'Interview', 'Offer', 'Rejected'];
const STATUS_BADGE = {
  APPLIED:   { cls: 'b-app', label: 'Applied' },
  INTERVIEW: { cls: 'b-int', label: 'Interview' },
  OFFER:     { cls: 'b-int', label: 'Offer', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
  REJECTED:  { cls: 'b-clo', label: 'Rejected' },
  FAILED:    { cls: 'b-clo', label: 'Failed' },
  PENDING:   { cls: 'b-new', label: 'New' },
  NEW:       { cls: 'b-new', label: 'New' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const DEMO_APPS = [
  { id: 1, job: { title: 'Product Designer', company: 'Google', location: 'Mountain View' }, status: 'APPLIED', created_at: new Date(Date.now() - 7200000).toISOString(), salary: '$120k–$160k/yr' },
  { id: 2, job: { title: 'UX Researcher', company: 'Spotify', location: 'Stockholm' }, status: 'INTERVIEW', created_at: new Date(Date.now() - 86400000).toISOString(), salary: '$95k–$130k/yr' },
  { id: 3, job: { title: 'Frontend Engineer', company: 'Netflix', location: 'Los Angeles' }, status: 'APPLIED', created_at: new Date(Date.now() - 172800000).toISOString(), salary: '$140k–$190k/yr' },
  { id: 4, job: { title: 'Data Scientist', company: 'Meta', location: 'New York' }, status: 'PENDING', created_at: new Date(Date.now() - 259200000).toISOString(), salary: '$160k–$200k/yr' },
  { id: 5, job: { title: 'ML Engineer', company: 'Apple', location: 'Cupertino' }, status: 'APPLIED', created_at: new Date(Date.now() - 345600000).toISOString(), salary: '$180k–$240k/yr' },
  { id: 6, job: { title: 'Design Lead', company: 'Shopify', location: 'Remote' }, status: 'INTERVIEW', created_at: new Date(Date.now() - 432000000).toISOString(), salary: '$150k–$190k/yr' },
  { id: 7, job: { title: 'Product Manager', company: 'Amazon', location: 'Seattle' }, status: 'REJECTED', created_at: new Date(Date.now() - 604800000).toISOString(), salary: '$135k–$175k/yr' },
];

export default function SavedScreen({ goTo, showToast, setSelectedJob, selectedJob, isDesktop }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    setLoading(true);
    try {
      const res = await applicationsApi.list();
      setApps(res?.data || []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }

  const list = apps.length > 0 ? apps : DEMO_APPS;
  const filtered = filter === 'All' ? list : list.filter((a) => {
    const status = (a.status || '').toUpperCase();
    const f = filter.toUpperCase();
    if (f === 'NEW') return status === 'PENDING' || status === 'NEW';
    return status === f;
  });

  const logoInitials = (company) => (company || 'J').slice(0, 2);
  const logoColors = { Google: 'var(--lime)', Spotify: '#34D399', Netflix: '#FCD34D', Meta: '#A78BFA', Apple: '#93C5FD', Shopify: '#34D399', Amazon: '#FCD34D' };

  if (isDesktop) {
    return (
      <div className="desktop-split-layout">
        {/* Left Column - List */}
        <div className="desktop-split-list">
          <div style={{ padding: '20px 20px 12px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text1)' }}>
              Applications <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--lime)' }}>({list.length})</span>
            </div>
          </div>

          {/* Filters */}
          <div className="saved-filters" style={{ padding: '0 20px 12px' }}>
            {STATUS_FILTERS.map((f) => (
              <div key={f} className={`schip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text3)', fontSize: 13 }}>
              <i className="ti ti-loader" style={{ fontSize: 24, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
              Loading applications…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 13 }}>
              <i className="ti ti-inbox" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
              No {filter !== 'All' ? filter.toLowerCase() : ''} applications yet
            </div>
          ) : (
            filtered.map((app) => {
              const job = app.job || {};
              const badge = STATUS_BADGE[app.status] || STATUS_BADGE.NEW;
              const co = job.company || 'Company';
              const color = logoColors[co] || 'var(--lime)';
              const isSelected = selectedJob && (selectedJob.application?.id === app.id || selectedJob.job?.id === job.id);
              return (
                <div key={app.id} className={`si ${isSelected ? 'selected-card' : ''}`} onClick={() => setSelectedJob({ job, application: app })}>
                  <div className="si-logo" style={{ background: `${color}18`, color }}>{logoInitials(co)}</div>
                  <div className="si-inf">
                    <div className="si-t">{job.title || 'Position'}</div>
                    <div className="si-s">{co} · {job.location || 'Remote'}</div>
                    <div className="si-sal">{app.salary || job.salary_min ? `₹${(job.salary_min / 100000).toFixed(0)}L+` : ''}{timeAgo(app.created_at) && ` · ${timeAgo(app.created_at)}`}</div>
                  </div>
                  <div className={`si-bdg ${badge.cls}`} style={badge.color ? { background: badge.bg, color: badge.color } : {}}>
                    {badge.label}
                  </div>
                </div>
              );
            })
          )}
          <div className="sp" />
        </div>

        {/* Right Column - Detail */}
        <div className="desktop-split-detail">
          {selectedJob ? (
            <DetailScreen back={() => setSelectedJob(null)} showToast={showToast} selectedJob={selectedJob} isDesktop={isDesktop} />
          ) : (
            <div className="desktop-empty-detail">
              <i className="ti ti-bookmark" />
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text1)' }}>No Application Selected</div>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>Select an application from the list to view its job description, cover letter requirements, and status tracking.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="logo">Job<span>Pilot</span></div>
        <div className="ibtn"><i className="ti ti-adjustments-horizontal" /></div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text1)' }}>
            Applications <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--lime)' }}>({list.length})</span>
          </div>
        </div>

        {/* Filters */}
        <div className="saved-filters">
          {STATUS_FILTERS.map((f) => (
            <div key={f} className={`schip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text3)', fontSize: 13 }}>
            <i className="ti ti-loader" style={{ fontSize: 24, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
            Loading applications…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 13 }}>
            <i className="ti ti-inbox" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
            No {filter !== 'All' ? filter.toLowerCase() : ''} applications yet
          </div>
        ) : (
          filtered.map((app) => {
            const job = app.job || {};
            const badge = STATUS_BADGE[app.status] || STATUS_BADGE.NEW;
            const co = job.company || 'Company';
            const color = logoColors[co] || 'var(--lime)';
            return (
              <div key={app.id} className="si" onClick={() => { setSelectedJob({ job, application: app }); goTo('detail'); }}>
                <div className="si-logo" style={{ background: `${color}18`, color }}>{logoInitials(co)}</div>
                <div className="si-inf">
                  <div className="si-t">{job.title || 'Position'}</div>
                  <div className="si-s">{co} · {job.location || 'Remote'}</div>
                  <div className="si-sal">{app.salary || job.salary_min ? `₹${(job.salary_min / 100000).toFixed(0)}L+` : ''}{timeAgo(app.created_at) && ` · ${timeAgo(app.created_at)}`}</div>
                </div>
                <div className={`si-bdg ${badge.cls}`} style={badge.color ? { background: badge.bg, color: badge.color } : {}}>
                  {badge.label}
                </div>
              </div>
            );
          })
        )}
        <div className="sp" />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
