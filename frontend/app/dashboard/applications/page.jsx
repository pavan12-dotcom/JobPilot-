'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Briefcase, Clock, FileText } from 'lucide-react';
import { applicationsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const DEMO_APPS = [
  { id: 'a1', job: { title: 'Senior Software Engineer', company: 'Google', location: 'Bangalore', salary_min: 2500000, salary_max: 4000000 }, status: 'APPLIED', applied_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'a2', job: { title: 'Backend Engineer', company: 'Swiggy', location: 'Bangalore', salary_min: 1800000, salary_max: 3000000 }, status: 'APPLIED', applied_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 'a3', job: { title: 'Full Stack Developer', company: 'Razorpay', location: 'Bangalore', salary_min: 2000000, salary_max: 3500000 }, status: 'APPLIED', applied_at: new Date(Date.now() - 259200000).toISOString() },
  { id: 'a4', job: { title: 'Software Engineer II', company: 'Microsoft', location: 'Hyderabad', salary_min: 2200000, salary_max: 3800000 }, status: 'INTERVIEW', applied_at: new Date(Date.now() - 432000000).toISOString() },
  { id: 'a5', job: { title: 'Backend Developer', company: 'CRED', location: 'Bangalore', salary_min: 1500000, salary_max: 2500000 }, status: 'INTERVIEW', applied_at: new Date(Date.now() - 604800000).toISOString() },
  { id: 'a6', job: { title: 'API Engineer', company: 'Stripe', location: 'Remote', salary_min: 3500000, salary_max: 6000000 }, status: 'OFFER', applied_at: new Date(Date.now() - 864000000).toISOString() },
  { id: 'a7', job: { title: 'Junior Developer', company: 'Paytm', location: 'Noida', salary_min: 1000000, salary_max: 1800000 }, status: 'REJECTED', applied_at: new Date(Date.now() - 691200000).toISOString() },
  { id: 'a8', job: { title: 'DevOps Engineer', company: 'Infosys', location: 'Pune', salary_min: 1200000, salary_max: 2200000 }, status: 'FAILED', applied_at: new Date(Date.now() - 86400000).toISOString(), failure_reason: 'CAPTCHA barrier detected' },
];

const STATUS_FILTERS = ['ALL', 'APPLIED', 'INTERVIEW', 'OFFER', 'FAILED'];

export default function ApplicationsPage() {
  const [apps, setApps] = useState(DEMO_APPS);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailLogs, setDetailLogs] = useState([]);
  const [updating, setUpdating] = useState(false);

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
      // Keep demo list
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
        { id: 1, event: 'Automation process initialized', created_at: app.applied_at || new Date() },
        { id: 2, event: 'AI personalized cover letter built', created_at: new Date(new Date(app.applied_at).getTime() + 4000) },
        { id: 3, event: 'Headless Playwright worker boot success', created_at: new Date(new Date(app.applied_at).getTime() + 9000) },
        { id: 4, event: 'Application submitted successfully', created_at: new Date(new Date(app.applied_at).getTime() + 25000) },
      ]);
    }
  }

  async function updateStatus(appId, newStatus) {
    setUpdating(true);
    try {
      await applicationsApi.updateStatus(appId, { status: newStatus });
      setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp?.id === appId) setSelectedApp((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Status set to ${newStatus}`);
    } catch { 
      toast.error('Failed to change status'); 
    } finally {
      setUpdating(false);
    }
  }

  const filtered = apps.filter((a) => filter === 'ALL' || a.status === filter);

  // Status mapping for CSS class
  const getBadgeClass = (status) => {
    switch (status) {
      case 'OFFER':
      case 'INTERVIEW':
        return 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80] border border-[rgba(74,222,128,0.2)]';
      case 'APPLIED':
        return 'bg-[rgba(251,191,36,0.12)] text-[#FCD34D] border border-[rgba(251,191,36,0.2)]';
      case 'FAILED':
      case 'REJECTED':
        return 'bg-[rgba(248,113,113,0.12)] text-[#FCA5A5] border border-[rgba(248,113,113,0.2)]';
      default:
        return 'bg-[rgba(96,165,250,0.12)] text-[#93C5FD] border border-[rgba(96,165,250,0.2)]';
    }
  };

  const getBadgeText = (status) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // Render detail overlay inside phone chassis
  if (selectedApp) {
    const app = selectedApp;
    return (
      <div className="flex-1 flex flex-col bg-[#141F14] animate-fade-in -mx-5 -mt-3 h-full">
        {/* Header */}
        <div className="det-topbar flex items-center justify-between p-4 bg-[#141F14] border-b border-[rgba(184,240,35,0.1)]">
          <button className="bk-btn" onClick={() => setSelectedApp(null)}>
            <i className="ti ti-arrow-left text-lg text-[#F0F5E8]"></i>
          </button>
          <span className="text-xs font-bold text-[#F0F5E8]">Application Details</span>
          <div className="w-9 h-9" />
        </div>

        {/* Scrollable details view */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8 space-y-5">
          <div className="text-center">
            <div className="det-logo w-14 h-14 rounded-2xl bg-[#B8F023]/10 border border-[rgba(184,240,35,0.15)] flex items-center justify-center font-extrabold text-lg text-[#B8F023] mx-auto mb-3">
              {app.job.company?.[0]?.toUpperCase() || 'J'}
            </div>
            <h2 className="text-base font-extrabold text-[#F0F5E8] leading-snug">{app.job.title}</h2>
            <p className="text-xs text-[#8BA882] mt-1 font-medium">{app.job.company} · {app.job.location}</p>
          </div>

          {app.failure_reason && (
            <div className="bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.15)] rounded-xl p-3 text-xs text-[#FCA5A5] leading-relaxed">
              ⚠️ Failure alert: {app.failure_reason}
            </div>
          )}

          {/* Action log timelines */}
          <div className="card space-y-4">
            <p className="text-xs font-bold text-[#F0F5E8] flex items-center gap-1.5 border-b border-[rgba(184,240,35,0.08)] pb-2">
              <Clock className="w-3.5 h-3.5 text-[#B8F023]" /> Automation Execution Log
            </p>
            <div className="space-y-4">
              {detailLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-[#B8F023] rounded-full mt-1" />
                    <div className="w-0.5 flex-1 bg-[rgba(184,240,35,0.15)] mt-1" />
                  </div>
                  <div>
                    <p className="font-bold text-[#F0F5E8]">{log.event}</p>
                    <p className="text-[10px] text-[#556B52] mt-0.5">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual override status update */}
          <div className="card space-y-3">
            <p className="text-xs font-bold text-[#8BA882]">Manual Status Override</p>
            <div className="flex flex-wrap gap-2">
              {['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(app.id, s)}
                  disabled={app.status === s || updating}
                  className={`py-1.5 px-3 rounded-full text-[10px] font-bold border transition-all cursor-pointer bg-transparent ${
                    app.status === s 
                      ? 'bg-[#B8F023] text-[#141F14] border-[#B8F023]' 
                      : 'border-[rgba(184,240,35,0.1)] text-[#8BA882] hover:border-[#B8F023]/30'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Title */}
      <div className="px-5 pt-3">
        <h2 className="text-lg font-extrabold text-[#F0F5E8] tracking-tight">Saved Applications</h2>
        <p className="text-xs text-[#8BA882] mt-0.5">Track your automation submission history</p>
      </div>

      {/* Filter Menu */}
      <div className="saved-filters flex gap-1.5 overflow-x-auto px-5 pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`schip py-1.5 px-3.5 text-[10px] font-bold rounded-full border bg-transparent cursor-pointer transition-all ${
              filter === s
                ? 'bg-[#B8F023] text-[#141F14] border-[#B8F023]'
                : 'border-[rgba(184,240,35,0.1)] text-[#8BA882] hover:border-[#B8F023]/30'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* App List */}
      <div className="flex-1 space-y-2.5 px-5">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#B8F023] mb-2" />
            <p className="text-xs text-[#8BA882]">Loading queue logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12 border-dashed">
            <FileText className="w-8 h-8 text-[#556B52] mx-auto mb-2" />
            <p className="text-xs text-[#8BA882]">No applications logs mapped.</p>
          </div>
        ) : (
          filtered.map((app) => (
            <div 
              key={app.id} 
              onClick={() => viewDetails(app)}
              className="si bg-[#1C2B1C] border border-[rgba(184,240,35,0.1)] rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer hover:border-[rgba(184,240,35,0.2)] transition-all"
            >
              <div className="si-logo w-10 h-10 rounded-xl bg-[#B8F023]/10 border border-[rgba(184,240,35,0.15)] flex items-center justify-center font-extrabold text-[#B8F023]">
                {app.job.company?.[0]?.toUpperCase() || 'J'}
              </div>
              <div className="si-inf flex-1 min-w-0">
                <p className="si-t text-sm font-bold text-[#F0F5E8] truncate leading-tight">{app.job.title}</p>
                <p className="si-s text-[11px] text-[#8BA882] mt-0.5 truncate">{app.job.company} · {app.job.location}</p>
                <p className="si-sal text-[10px] font-bold text-[#B8F023] mt-0.5">
                  {app.job.salary_min ? `₹${(app.job.salary_min/100000).toFixed(0)}L/yr` : 'Matched Profile'}
                </p>
              </div>
              <span className={`si-bdg text-[9px] font-bold px-2 py-0.5 rounded-full ${getBadgeClass(app.status)}`}>
                {getBadgeText(app.status)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
