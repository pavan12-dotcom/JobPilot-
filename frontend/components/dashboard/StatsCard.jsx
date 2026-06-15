'use client';
// components/dashboard/StatsCard.jsx
import { TrendingUp } from 'lucide-react';
import clsx from 'clsx';

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  };

  return (
    <div className="card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center border', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend >= 0 ? 'text-success bg-success/10' : 'text-error bg-error/10',
          )}>
            <TrendingUp className={clsx('w-3 h-3', trend < 0 && 'rotate-180')} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-text mb-1">
        {value}
      </p>
      <p className="text-sm font-medium text-text-muted">{title}</p>
      {subtitle && <p className="text-xs text-text-subtle mt-1">{subtitle}</p>}
    </div>
  );
}
