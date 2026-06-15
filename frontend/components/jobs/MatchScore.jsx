'use client';
// components/jobs/MatchScore.jsx
import clsx from 'clsx';

export default function MatchScore({ score, size = 'md' }) {
  const color =
    score >= 90 ? 'text-success border-success bg-success/10 shadow-success/30' :
    score >= 70 ? 'text-primary border-primary bg-primary/10 shadow-primary/30' :
    score >= 50 ? 'text-warning border-warning bg-warning/10' :
    'text-text-muted border-border bg-card';

  const glow = score >= 90 ? 'shadow-lg' : score >= 70 ? 'shadow-md' : '';

  const sizeMap = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  return (
    <div
      className={clsx(
        'rounded-full border-2 flex items-center justify-center font-bold shrink-0',
        color, glow, sizeMap[size],
      )}
    >
      {score}
    </div>
  );
}
