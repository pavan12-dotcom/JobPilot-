'use client';
// components/jobs/MatchScore.jsx
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function MatchScore({ score, size = 'md' }) {
  const scoreNum = Number(score) || 0;

  const colorMap = {
    success: {
      text: 'text-success',
      stroke: 'var(--success)',
      bg: 'rgba(34, 197, 94, 0.1)',
      glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]',
    },
    primary: {
      text: 'text-primary-light',
      stroke: 'var(--primary)',
      bg: 'rgba(99, 102, 241, 0.1)',
      glow: 'shadow-[0_0_15px_rgba(99,102,241,0.2)]',
    },
    warning: {
      text: 'text-warning',
      stroke: 'var(--warning)',
      bg: 'rgba(245, 158, 11, 0.1)',
      glow: '',
    },
    muted: {
      text: 'text-text-muted',
      stroke: 'var(--border)',
      bg: 'rgba(42, 42, 56, 0.2)',
      glow: '',
    },
  };

  const status =
    scoreNum >= 90 ? 'success' :
    scoreNum >= 70 ? 'primary' :
    scoreNum >= 50 ? 'warning' :
    'muted';

  const config = colorMap[status];

  const sizeConfigMap = {
    sm: { box: 'w-10 h-10', dim: 40, r: 16, strokeWidth: 3, font: 'text-[11px]' },
    md: { box: 'w-12 h-12', dim: 48, r: 20, strokeWidth: 3.5, font: 'text-xs' },
    lg: { box: 'w-16 h-16', dim: 64, r: 26, strokeWidth: 4.5, font: 'text-sm' },
  };

  const sizeCfg = sizeConfigMap[size] || sizeConfigMap.md;
  const center = sizeCfg.dim / 2;
  const circumference = 2 * Math.PI * sizeCfg.r;
  const strokeOffset = circumference - (circumference * scoreNum) / 100;

  return (
    <div
      className={clsx(
        'relative rounded-full flex items-center justify-center font-bold shrink-0',
        config.glow,
        sizeCfg.box
      )}
      style={{ backgroundColor: config.bg }}
    >
      <svg className="absolute w-full h-full transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={sizeCfg.r}
          stroke="rgba(42, 42, 56, 0.5)"
          strokeWidth={sizeCfg.strokeWidth}
          fill="transparent"
        />
        {/* Animated Match Progress Ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={sizeCfg.r}
          stroke={config.stroke}
          strokeWidth={sizeCfg.strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeOffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <span className={clsx('relative z-10 font-bold', config.text, sizeCfg.font)}>
        {scoreNum}%
      </span>
    </div>
  );
}

