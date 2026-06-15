'use client';
// app/dashboard/page.jsx — Main dashboard
import { useEffect, useState } from 'react';
import { Send, Calendar, TrendingUp, Target, Lightbulb, RefreshCcw, Zap } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import MatchChart from '@/components/dashboard/MatchChart';
import { dashboardApi, jobsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [statsRes, activityRes, insightsRes] = await Promise.allSettled([
        dashboardApi.stats(),
        dashboardApi.activity(15),
        dashboardApi.insights(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value.data || []);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data?.insights || []);
    } catch (err) {
      // Use demo data if API not available
      setStats({
        total_applied: 23,
        interviews: 4,
        offers: 1,
        success_rate: 17,
        jobs_matched_today: 12,
        applied_today: 5,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshJobs() {
    setRefreshing(true);
    try {
      await jobsApi.refresh();
      toast.success('Job refresh triggered! New matches coming soon.');
    } catch {
      toast.error('Set preferences first to fetch jobs.');
    } finally {
      setRefreshing(false);
    }
  }

  const DEMO_STATS = {
    total_applied: 23, interviews: 4, offers: 1,
    success_rate: 17, jobs_matched_today: 12, applied_today: 5,
  };
  const displayStats = stats || DEMO_STATS;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Overview</h2>
          <p className="text-text-muted text-sm mt-0.5">Your job search at a glance</p>
        </div>
        <button
          id="refresh-jobs-btn"
          onClick={handleRefreshJobs}
          disabled={refreshing}
          className="btn-secondary gap-2"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Jobs
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="card h-28 skeleton" />)
        ) : (
          <>
            <StatsCard
              title="Total Applied"
              value={displayStats.total_applied}
              subtitle={`${displayStats.applied_today} today`}
              icon={Send}
              color="primary"
              trend={12}
            />
            <StatsCard
              title="Interviews"
              value={displayStats.interviews}
              subtitle="This month"
              icon={Calendar}
              color="success"
              trend={5}
            />
            <StatsCard
              title="Success Rate"
              value={`${displayStats.success_rate}%`}
              subtitle="Applied → Interview"
              icon={TrendingUp}
              color="warning"
            />
            <StatsCard
              title="Matched Today"
              value={displayStats.jobs_matched_today}
              subtitle="New job matches"
              icon={Target}
              color="blue"
              trend={8}
            />
          </>
        )}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text">Weekly Activity</h3>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-primary rounded" /> Matched</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-success rounded" /> Applied</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-warning rounded" /> Score</span>
            </div>
          </div>
          <MatchChart />
        </div>

        {/* Activity Feed */}
        <div className="card overflow-hidden">
          <h3 className="font-semibold text-text mb-4">Recent Activity</h3>
          <div className="overflow-y-auto max-h-64 -mx-2 px-2">
            <ActivityFeed activities={activity} loading={loading} />
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-warning/10 border border-warning/20 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-warning" />
            </div>
            <h3 className="font-semibold text-text">AI Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border text-sm ${
                  insight.type === 'positive' ? 'bg-success/10 border-success/20 text-success' :
                  insight.type === 'warning' ? 'bg-warning/10 border-warning/20 text-warning' :
                  'bg-primary/10 border-primary/20 text-primary-light'
                }`}
              >
                {insight.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Apply Status */}
      <div className="card bg-gradient-to-r from-primary/10 via-card to-card border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-text">Auto-Apply is Active</p>
              <p className="text-sm text-text-muted">Applying to jobs with 70%+ match score automatically</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-success font-medium">Running</span>
          </div>
        </div>
      </div>
    </div>
  );
}
