'use client';
// app/dashboard/applications/page.jsx
import { useEffect, useState } from 'react';
import { ClipboardList, ExternalLink, Eye, X, ChevronDown } from 'lucide-react';
import StatusBadge from '@/components/applications/StatusBadge';
import ApplicationTimeline from '@/components/applications/ApplicationTimeline';
import { applicationsApi } from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const DEMO_APPS = [
  { id: 'a1', job: { title: 'Senior Software Engineer', company: 'Google', location: 'Bangalore', apply_url: '#' }, match: { match_score: 94 }, status: 'APPLIED', application_method: 'AUTO', applied_at: new Date(Date.now() - 86400000).toISOString(), _count: { logs: 6 } },
  { id: 'a2', job: { title: 'Backend Engineer', company: 'Swiggy', location: 'Bangalore', apply_url: '#' }, match: { match_score: 89 }, status: 'APPLIED', application_method: 'AUTO', applied_at: new Date(Date.now() - 172800000).toISOString(), _count: { logs: 5 } },
  { id: 'a3', job: { title: 'Full Stack Developer', company: 'Razorpay', location: 'Bangalore', apply_url: '#' }, match: { match_score: 86 }, status: 'APPLIED', application_method: 'MANUAL', applied_at: new Date(Date.now() - 259200000).toISOString(), _count: { logs: 2 } },
  { id: 'a4', job: { title: 'Software Engineer II', company: 'Microsoft', location: 'Hyderabad', apply_url: '#' }, match: { match_score: 88 }, status: 'INTERVIEW', application_method: 'AUTO', applied_at: new Date(Date.now() - 432000000).toISOString(), _count: { logs: 7 } },
  { id: 'a5', job: { title: 'Backend Developer', company: 'CRED', location: 'Bangalore', apply_url: '#' }, match: { match_score: 72 }, status: 'INTERVIEW', application_method: 'AUTO', applied_at: new Date(Date.now() - 604800000).toISOString(), _count: { logs: 6 } },
  { id: 'a6', job: { title: 'API Engineer', company: 'Stripe', location: 'Remote', apply_url: '#' }, match: { match_score: 91 }, status: 'OFFER', application_method: 'AUTO', applied_at: new Date(Date.now() - 864000000).toISOString(), _count: { logs: 8 } },
  { id: 'a7', job: { title: 'Junior Backend Developer', company: 'Paytm', location: 'Noida', apply_url: '#' }, match: { match_score: 65 }, status: 'REJECTED', application_method: 'AUTO', applied_at: new Date(Date.now() - 691200000).toISOString(), _count: { logs: 4 } },
  { id: 'a8', job: { title: 'DevOps Engineer', company: 'Infosys', location: 'Pune', apply_url: '#' }, match: { match_score: 58 }, status: 'FAILED', application_method: 'AUTO', applied_at: new Date(Date.now() - 86400000).toISOString(), failure_reason: 'CAPTCHA detected — manual apply required', _count: { logs: 3 } },
];

const STATUS_FILTERS = ['ALL', 'APPLIED', 'INTERVIEW', 'OFFER', 'FAILED', 'REJECTED'];

export default function ApplicationsPage() {
  const [apps, setApps] = useState(DEMO_APPS);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailLogs, setDetailLogs] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const res = await applicationsApi.list(params);
      if (res.data?.length > 0) setApps(res.data);
    } catch {
      // Keep demo data
    } finally {
      setLoading(false);
    }
  }

  async function viewDetails(app) {
    setSelectedApp(app);
    try {
      const res = await applicationsApi.getById(app.id);
      setDetailLogs(res.data?.logs || []);
    } catch {
      setDetailLogs([
        { id: 1, event: 'Application created', metadata: { method: 'AUTO' }, created_at: app.applied_at || new Date() },
        { id: 2, event: 'Cover letter generated', metadata: { words: 120 }, created_at: new Date(new Date(app.applied_at).getTime() + 5000) },
        { id: 3, event: 'Browser launched', metadata: { headless: true }, created_at: new Date(new Date(app.applied_at).getTime() + 10000) },
        { id: 4, event: 'Application submitted', metadata: { success: true }, created_at: new Date(new Date(app.applied_at).getTime() + 30000) },
      ]);
    }
  }

  async function updateStatus(appId, newStatus) {
    try {
      await applicationsApi.updateStatus(appId, { status: newStatus });
      setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp?.id === appId) setSelectedApp((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
  }

  const filtered = apps.filter((a) => filter === 'ALL' || a.status === filter);

  const statusCounts = STATUS_FILTERS.slice(1).reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text">Applications</h2>
          <p className="text-text-muted text-sm">{apps.length} total applications</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            id={`filter-${s.toLowerCase()}`}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === s
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-text-muted hover:text-text'
            }`}
          >
            {s}
            {s !== 'ALL' && statusCounts[s] > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({statusCounts[s]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-text-muted font-medium">Company & Role</th>
                <th className="text-center px-4 py-4 text-text-muted font-medium">Score</th>
                <th className="text-center px-4 py-4 text-text-muted font-medium">Status</th>
                <th className="text-center px-4 py-4 text-text-muted font-medium">Method</th>
                <th className="text-left px-4 py-4 text-text-muted font-medium">Applied</th>
                <th className="text-center px-4 py-4 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-text-muted">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No applications found
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-border hover:bg-surface transition-colors cursor-pointer"
                    onClick={() => viewDetails(app)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-text">{app.job.title}</p>
                      <p className="text-text-muted text-xs">{app.job.company} · {app.job.location}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {app.match?.match_score && (
                        <span className={`font-bold text-sm ${
                          app.match.match_score >= 80 ? 'text-success' :
                          app.match.match_score >= 60 ? 'text-primary' : 'text-warning'
                        }`}>
                          {app.match.match_score}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-4 text-center">
                      <span className={`badge ${app.application_method === 'AUTO' ? 'badge-blue' : 'badge-gray'}`}>
                        {app.application_method === 'AUTO' ? '⚡ Auto' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-text-muted text-xs">
                      {app.applied_at ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true }) : '—'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        id={`view-app-${app.id}`}
                        onClick={(e) => { e.stopPropagation(); viewDetails(app); }}
                        className="p-1.5 rounded-lg hover:bg-card transition-colors text-text-muted hover:text-text"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedApp(null)} />
          <div className="relative bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-text">{selectedApp.job.title}</h3>
                <p className="text-text-muted">{selectedApp.job.company} · {selectedApp.job.location}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 rounded-lg hover:bg-card">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {selectedApp.failure_reason && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-4 text-sm text-error">
                ⚠️ {selectedApp.failure_reason}
              </div>
            )}

            <ApplicationTimeline
              logs={detailLogs}
              status={selectedApp.status}
              createdAt={selectedApp.applied_at}
            />

            {/* Status update */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm font-medium text-text-muted mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selectedApp.id, s)}
                    disabled={selectedApp.status === s}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedApp.status === s ? 'bg-primary text-white' : 'bg-card border border-border text-text-muted hover:text-text'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
