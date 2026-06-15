'use client';
// components/dashboard/StatsCard.jsx
import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import clsx from 'clsx';

function AnimatedCounter({ value }) {
  const [displayVal, setDisplayVal] = useState('0');

  useEffect(() => {
    const stringVal = String(value);
    const hasPercent = stringVal.endsWith('%');
    const numericPart = parseFloat(stringVal.replace(/[^0-9.]/g, ''));

    if (isNaN(numericPart)) {
      setDisplayVal(value);
      return;
    }

    const controls = animate(0, numericPart, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (val) => {
        setDisplayVal(Math.round(val) + (hasPercent ? '%' : ''));
      },
    });

    return () => controls.stop();
  }, [value]);

  return <span>{displayVal}</span>;
}

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.025, translateY: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="card-hover group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center border transition-colors duration-300 group-hover:border-primary/50 group-hover:bg-primary/20', colorMap[color])}>
          <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
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
        <AnimatedCounter value={value} />
      </p>
      <p className="text-sm font-medium text-text-muted">{title}</p>
      {subtitle && <p className="text-xs text-text-subtle mt-1">{subtitle}</p>}
    </motion.div>
  );
}

