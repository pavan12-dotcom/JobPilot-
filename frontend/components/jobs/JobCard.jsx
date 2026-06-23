'use client';
import { getSourceLabel } from '@/lib/sourceLabels';
import { motion } from 'framer-motion';
import { MapPin, Building2, Clock, Bookmark, BookmarkCheck, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import MatchScore from './MatchScore';

export default function JobCard({ match, onSave, onApply, onClick }) {
  const { job, match_score, match_reasons, is_saved } = match;
  const skills = match_reasons?.skills_matched?.slice(0, 3) || [];

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${n.toLocaleString()}`;
    return min && max ? `${fmt(min)} – ${fmt(max)}` : min ? `${fmt(min)}+` : null;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        scale: 1.015, 
        translateY: -3,
        borderColor: 'rgba(239, 77, 94, 0.25)',
        boxShadow: '0 15px 30px rgba(239, 77, 94, 0.05)'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="card-hover cursor-pointer group"
      onClick={() => onClick?.(match)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Company logo */}
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 text-text-muted transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary/5">
            <Building2 className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 text-text-muted group-hover:text-primary-light" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-text text-sm leading-tight truncate group-hover:text-primary-light transition-colors">
              {job.title}
            </h3>
            <p className="text-text-muted text-xs mt-0.5 truncate">{job.company}</p>
          </div>
        </div>
        <MatchScore score={match_score} size="sm" />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted mb-3">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
        <span className="flex items-center gap-1 capitalize">{job.job_type?.replace('_', ' ')}</span>
        {salary && <span className="text-success font-medium">{salary}</span>}
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(job.posted_at || Date.now()), { addSuffix: true })}
        </span>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.map((skill, index) => (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 12 }}
              key={skill} 
              className="badge-blue text-[11px]"
            >
              {skill}
            </motion.span>
          ))}
          {match_reasons?.skills_matched?.length > 3 && (
            <span className="badge-gray text-[11px]">+{match_reasons.skills_matched.length - 3}</span>
          )}
        </div>
      )}

      {/* Source badge */}
      <div className="flex items-center justify-between">
        <span className="badge-gray">{getSourceLabel(job.source)}</span>

        {/* Actions */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            id={`save-job-${job.id}`}
            onClick={() => onSave?.(match)}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-muted hover:text-warning"
            title={is_saved ? 'Unsave' : 'Save'}
          >
            {is_saved
              ? <BookmarkCheck className="w-4 h-4 text-warning" />
              : <Bookmark className="w-4 h-4" />}
          </button>
          <button
            id={`apply-job-${job.id}`}
            onClick={() => onApply?.(match)}
            className="btn-primary py-1.5 px-3 text-xs gap-1.5 relative overflow-hidden group/btn"
          >
            <Zap className="w-3 h-3 transition-transform duration-300 group-hover/btn:scale-125 group-hover/btn:rotate-12" /> 
            <span>Auto Apply</span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

