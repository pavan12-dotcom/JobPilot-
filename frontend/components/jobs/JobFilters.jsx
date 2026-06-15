'use client';
// components/jobs/JobFilters.jsx
import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

const JOB_TYPES = ['FULL_TIME', 'REMOTE', 'CONTRACT', 'PART_TIME', 'INTERNSHIP'];
const SOURCES = ['ADZUNA', 'REMOTIVE', 'THEMUSE', 'LINKEDIN'];

export default function JobFilters({ filters, onChange }) {
  const { min_score = 50, job_type = '', source = '' } = filters;

  return (
    <div className="w-64 shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" /> Filters
        </h3>
        <button
          onClick={() => onChange({ min_score: 50, job_type: '', source: '' })}
          className="text-xs text-text-muted hover:text-text transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Match Score */}
      <div>
        <label className="block text-sm font-medium text-text-muted mb-3">
          Min Match Score: <span className="text-primary font-bold">{min_score}%</span>
        </label>
        <input
          id="filter-min-score"
          type="range"
          min="0"
          max="100"
          step="5"
          value={min_score}
          onChange={(e) => onChange({ ...filters, min_score: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-text-subtle mt-1">
          <span>0%</span><span>100%</span>
        </div>
      </div>

      {/* Job Type */}
      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">Job Type</label>
        <div className="space-y-2">
          {JOB_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                id={`filter-type-${type}`}
                type="radio"
                name="job_type"
                value={type}
                checked={job_type === type}
                onChange={(e) => onChange({ ...filters, job_type: e.target.value })}
                className="accent-primary"
              />
              <span className="text-sm text-text-muted capitalize">{type.replace('_', ' ')}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="job_type"
              value=""
              checked={job_type === ''}
              onChange={() => onChange({ ...filters, job_type: '' })}
              className="accent-primary"
            />
            <span className="text-sm text-text-muted">All Types</span>
          </label>
        </div>
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">Source</label>
        <div className="space-y-2">
          {SOURCES.map((src) => (
            <label key={src} className="flex items-center gap-2 cursor-pointer">
              <input
                id={`filter-source-${src}`}
                type="radio"
                name="source"
                value={src}
                checked={source === src}
                onChange={(e) => onChange({ ...filters, source: e.target.value })}
                className="accent-primary"
              />
              <span className="text-sm text-text-muted">{src}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="source"
              value=""
              checked={source === ''}
              onChange={() => onChange({ ...filters, source: '' })}
              className="accent-primary"
            />
            <span className="text-sm text-text-muted">All Sources</span>
          </label>
        </div>
      </div>
    </div>
  );
}
