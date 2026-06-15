'use client';
// components/dashboard/ActivityFeed.jsx
import { formatDistanceToNow } from 'date-fns';
import { Briefcase, Target, Calendar, CheckCircle, XCircle, Trophy } from 'lucide-react';
import clsx from 'clsx';

const ACTIVITY_ICONS = {
  application: Briefcase,
  match: Target,
  schedule: Calendar,
  APPLIED: CheckCircle,
  INTERVIEW: Trophy,
  FAILED: XCircle,
  OFFER: Trophy,
};

const STATUS_COLORS = {
  APPLIED: 'text-success',
  INTERVIEW: 'text-primary',
  OFFER: 'text-warning',
  FAILED: 'text-error',
  REJECTED: 'text-error',
  match: 'text-blue-400',
  application: 'text-text-muted',
};

export default function ActivityFeed({ activities = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 items-start p-3">
            <div className="w-8 h-8 skeleton rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-3 skeleton rounded w-3/4" />
              <div className="h-3 skeleton rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="text-center py-8 text-text-muted">
        <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No activity yet. Start by uploading your resume!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((item, i) => {
        const Icon = ACTIVITY_ICONS[item.status] || ACTIVITY_ICONS[item.type] || Briefcase;
        const color = STATUS_COLORS[item.status] || STATUS_COLORS[item.type] || 'text-text-muted';

        return (
          <div
            key={item.id || i}
            className="flex gap-3 items-start p-3 rounded-lg hover:bg-surface transition-colors animate-fade-in"
          >
            <div className={clsx('w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0', color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text font-medium truncate">{item.title}</p>
              <p className="text-xs text-text-muted">{item.subtitle}</p>
            </div>
            <span className="text-xs text-text-subtle shrink-0">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
