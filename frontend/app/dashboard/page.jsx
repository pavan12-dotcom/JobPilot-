'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw, Zap } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import MatchChart from '@/components/dashboard/MatchChart';
import { dashboardApi, jobsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Arun');

  useEffect(() => {
    loadDashboard();
    const userData = localStorage.getItem('applyai_user');
    if (userData) {
      try {
        const u = JSON.parse(userData);
        if (u.name) setUserName(u.name.split(' ')[0]);
      } catch {}
    }
  }, []);

  async function loadDashboard() {
    try {
      const [statsRes, activityRes, insightsRes] = await Promise.allSettled([
        dashboardApi.stats(),
        dashboardApi.activity(5),
        dashboardApi.insights(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value.data || []);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data?.insights || []);
    } catch (err) {
      // Use demo data if API not available
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshJobs() {
    setRefreshing(true);
    try {
      await jobsApi.refresh();
      toast.success('Job refresh triggered!');
      loadDashboard();
    } catch {
      toast.error('Set preferences first to fetch jobs.');
    } finally {
      setRefreshing(false);
    }
  }

  const DEMO_STATS = {
    total_applied: 23,
    interviews: 4,
    success_rate: 17,
    jobs_matched_today: 12,
    applied_today: 5,
  };
  const displayStats = stats || DEMO_STATS;

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* 1. Hero greeting section */}
      <div className="hero-sec px-5 pt-3">
        <div className="hero-greet text-xs text-[#8BA882] mb-0.5">Good morning, {userName} 👋</div>
        <div className="hero-h text-2xl font-extrabold text-[#F0F5E8] leading-tight">
          Find your <em className="text-[#B8F023] not-italic font-extrabold">dream job</em><br />today
        </div>
        <p className="hero-sub text-[11px] text-[#8BA882] mt-1.5 leading-relaxed">
          Queue is active. Autopilot matches jobs to your skills 24/7.
        </p>
      </div>

      {/* 2. Interactive Search Box */}
      <div className="search-wrap px-5">
        <div 
          onClick={() => router.push('/dashboard/jobs')} 
          className="search-bar flex items-center gap-2.5 bg-[#1C2B1C] border border-[rgba(184,240,35,0.10)] rounded-full padding p-3 cursor-pointer hover:border-[rgba(184,240,35,0.20)] transition-all"
        >
          <i className="ti ti-search text-base text-[#B8F023]"></i>
          <span className="text-xs text-[#556B52] flex-1">Search jobs, skills, matches…</span>
          <div className="search-flt w-7 h-7 bg-[#B8F023] rounded-lg flex items-center justify-center">
            <i className="ti ti-adjustments-horizontal text-xs text-[#141F14]"></i>
          </div>
        </div>
      </div>

      {/* 3. Stats row */}
      <div className="stats-row flex gap-2.5 px-5">
        <div className="stat-card flex-1 bg-[#1C2B1C] border border-[rgba(184,240,35,0.10)] rounded-xl p-3 text-center">
          <div className="stat-num text-lg font-extrabold text-[#B8F023]">{displayStats.total_applied}</div>
          <div className="stat-lbl text-[9px] text-[#8BA882] mt-0.5">Total Applied</div>
        </div>
        <div className="stat-card flex-1 bg-[#1C2B1C] border border-[rgba(184,240,35,0.10)] rounded-xl p-3 text-center">
          <div className="stat-num text-lg font-extrabold text-[#B8F023]">{displayStats.interviews}</div>
          <div className="stat-lbl text-[9px] text-[#8BA882] mt-0.5">Interviews</div>
        </div>
        <div className="stat-card flex-1 bg-[#1C2B1C] border border-[rgba(184,240,35,0.10)] rounded-xl p-3 text-center">
          <div className="stat-num text-lg font-extrabold text-[#B8F023]">{displayStats.success_rate}%</div>
          <div className="stat-lbl text-[9px] text-[#8BA882] mt-0.5">Success Rate</div>
        </div>
        <div className="stat-card flex-1 bg-[#1C2B1C] border border-[rgba(184,240,35,0.10)] rounded-xl p-3 text-center">
          <div className="stat-num text-lg font-extrabold text-[#B8F023]">{displayStats.jobs_matched_today}</div>
          <div className="stat-lbl text-[9px] text-[#8BA882] mt-0.5">Matched Today</div>
        </div>
      </div>

      {/* 4. Action bar */}
      <div className="px-5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8BA882]">Automation Analytics</h3>
        <button
          id="refresh-jobs-btn"
          onClick={handleRefreshJobs}
          disabled={refreshing}
          className="text-xs text-[#B8F023] flex items-center gap-1 hover:underline disabled:opacity-50 cursor-pointer font-bold border-none bg-transparent"
        >
          <RefreshCcw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Scan Queue
        </button>
      </div>

      {/* 5. Weekly Chart Container */}
      <div className="card shadow-sm border border-[rgba(184,240,35,0.10)]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-bold text-[#F0F5E8]">Weekly Activity Logs</span>
          <div className="flex gap-2 text-[9px] text-[#8BA882]">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#B8F023] rounded-full" /> Matched</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full" /> Applied</span>
          </div>
        </div>
        <MatchChart />
      </div>

      {/* 6. AI Insights alerts */}
      {insights.length > 0 && (
        <div className="card border border-[rgba(184,240,35,0.10)] bg-[#1C2B1C]/50 space-y-2">
          <p className="text-xs font-bold text-[#B8F023] flex items-center gap-1">
            <i className="ti ti-bulb text-sm"></i> AI Recommendation Insights:
          </p>
          <div className="space-y-1.5">
            {insights.slice(0, 2).map((ins, i) => (
              <p key={i} className="text-[11px] leading-relaxed text-[#8BA882] italic">
                - "{ins.message}"
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 7. Auto-Apply Queue panel */}
      <div className="card border border-[rgba(184,240,35,0.15)] bg-[rgba(184,240,35,0.06)] flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[rgba(184,240,35,0.15)] border border-[rgba(184,240,35,0.20)] flex items-center justify-center">
            <i className="ti ti-zap text-lg text-[#B8F023] animate-pulse"></i>
          </div>
          <div>
            <p className="font-bold text-sm text-[#F0F5E8]">Autopilot Active</p>
            <p className="text-[10px] text-[#8BA882] mt-0.5">Scoring threshold matches of 70%+</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#4ADE80] bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.15)] px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full animate-ping" /> Running
        </span>
      </div>

      {/* 8. Recent Activity feed */}
      <div className="card border border-[rgba(184,240,35,0.10)]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#8BA882] mb-3">Recent Activity Logs</h4>
        <div className="max-h-40 overflow-y-auto">
          <ActivityFeed activities={activity} loading={loading} />
        </div>
      </div>
    </div>
  );
}
