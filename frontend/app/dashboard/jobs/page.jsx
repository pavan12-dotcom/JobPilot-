'use client';
// app/dashboard/jobs/page.jsx
import { useEffect, useState, useCallback } from 'react';
import { Search, Briefcase, X, ExternalLink, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';
import JobFilters from '@/components/jobs/JobFilters';
import MatchScore from '@/components/jobs/MatchScore';
import { jobsApi } from '@/lib/api';
import toast from 'react-hot-toast';

// Demo job data for when API is not available
const DEMO_JOBS = [
  { id: '1', job: { id: 'j1', title: 'Senior Software Engineer', company: 'Google', location: 'Bangalore', job_type: 'FULL_TIME', source: 'ADZUNA', salary_min: 2500000, salary_max: 4000000, posted_at: new Date(Date.now() - 86400000).toISOString(), description: 'Join Google and work on products used by billions.', apply_url: '#' }, match_score: 94, match_reasons: { skills_matched: ['Node.js', 'React', 'PostgreSQL'], skills_missing: [], experience_fit: 'good', summary: 'Strong match! Your 3 years of Node.js and React experience directly aligns.' }, is_saved: false },
  { id: '2', job: { id: 'j2', title: 'Backend Engineer (Node.js)', company: 'Swiggy', location: 'Bangalore', job_type: 'FULL_TIME', source: 'ADZUNA', salary_min: 1800000, salary_max: 3000000, posted_at: new Date(Date.now() - 172800000).toISOString(), description: 'Build APIs that power food delivery for millions.', apply_url: '#' }, match_score: 89, match_reasons: { skills_matched: ['Node.js', 'PostgreSQL', 'Redis'], skills_missing: ['Kubernetes'], experience_fit: 'good', summary: 'Excellent backend match. Your Node.js and Redis skills are a perfect fit.' }, is_saved: true },
  { id: '3', job: { id: 'j3', title: 'Full Stack Developer', company: 'Razorpay', location: 'Bangalore', job_type: 'FULL_TIME', source: 'ADZUNA', salary_min: 2000000, salary_max: 3500000, posted_at: new Date(Date.now() - 259200000).toISOString(), description: 'Work on India\'s leading payments infrastructure.', apply_url: '#' }, match_score: 86, match_reasons: { skills_matched: ['React', 'Node.js', 'TypeScript'], skills_missing: ['Go'], experience_fit: 'good', summary: 'Strong full-stack match with React and Node.js experience.' }, is_saved: false },
  { id: '4', job: { id: 'j4', title: 'Remote Node.js Developer', company: 'GitLab', location: 'Remote', job_type: 'REMOTE', source: 'REMOTIVE', salary_min: 3000000, salary_max: 5000000, posted_at: new Date(Date.now() - 345600000).toISOString(), description: 'Help build the world\'s DevOps platform.', apply_url: '#' }, match_score: 85, match_reasons: { skills_matched: ['Node.js', 'Git', 'Docker'], skills_missing: ['Ruby'], experience_fit: 'good', summary: 'Good match for remote Node.js role. Strong backend fundamentals.' }, is_saved: false },
  { id: '5', job: { id: 'j5', title: 'API Engineer', company: 'Stripe', location: 'Remote', job_type: 'REMOTE', source: 'THEMUSE', salary_min: 3500000, salary_max: 6000000, posted_at: new Date(Date.now() - 432000000).toISOString(), description: 'Build payment APIs used by millions of businesses.', apply_url: '#' }, match_score: 91, match_reasons: { skills_matched: ['Node.js', 'PostgreSQL', 'AWS'], skills_missing: [], experience_fit: 'good', summary: 'Excellent match! Your API development and PostgreSQL skills are highly relevant.' }, is_saved: false },
  { id: '6', job: { id: 'j6', title: 'TypeScript Developer', company: 'Vercel', location: 'Remote', job_type: 'REMOTE', source: 'THEMUSE', salary_min: 3200000, salary_max: 5500000, posted_at: new Date(Date.now() - 518400000).toISOString(), description: 'Build the infrastructure for the Next.js ecosystem.', apply_url: '#' }, match_score: 88, match_reasons: { skills_matched: ['TypeScript', 'React', 'Node.js'], skills_missing: [], experience_fit: 'good', summary: 'Excellent TypeScript and React match for this Next.js-focused role.' }, is_saved: false },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState(DEMO_JOBS);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ min_score: 50, job_type: '', source: '' });
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(DEMO_JOBS.length);

  useEffect(() => {
    fetchJobs();
  }, [filters, page]);

  async function fetchJobs() {
    setLoading(true);
    try {
      const res = await jobsApi.getRecommended({ ...filters, page, limit: 12 });
      setJobs(res.data || DEMO_JOBS);
      setTotal(res.pagination?.total || res.data?.length || 0);
    } catch {
      // Keep demo data
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(match) {
    try {
      const res = await jobsApi.save(match.job.id);
      setJobs((prev) =>
        prev.map((m) => m.job.id === match.job.id ? { ...m, is_saved: res.data.is_saved } : m),
      );
      toast.success(res.data.is_saved ? 'Job saved!' : 'Job unsaved');
    } catch { toast.error('Failed to save job'); }
  }

  async function handleApply(match) {
    try {
      await jobsApi.apply(match.job.id);
      toast.success('Application queued! Auto-apply starting...');
    } catch (err) { toast.error(err?.error || 'Failed to queue application'); }
  }

  const filteredJobs = jobs.filter((m) => {
    if (search && !m.job.title.toLowerCase().includes(search.toLowerCase()) &&
        !m.job.company.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text">Job Recommendations</h2>
          <p className="text-text-muted text-sm">{total} jobs matched your profile</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <input
            id="job-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="input pl-9 w-64"
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <div className="card h-fit sticky top-0">
          <JobFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Job grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="card h-44 skeleton" />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="card text-center py-16">
              <Briefcase className="w-12 h-12 text-text-subtle mx-auto mb-3" />
              <p className="text-text-muted">No jobs match your current filters</p>
              <button onClick={() => setFilters({ min_score: 50, job_type: '', source: '' })} className="btn-secondary mt-3">
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((match) => (
                <JobCard
                  key={match.id || match.job.id}
                  match={match}
                  onSave={handleSave}
                  onApply={handleApply}
                  onClick={setSelectedJob}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job detail drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedJob(null)} />
          <div className="relative w-full max-w-xl bg-surface border-l border-border h-full overflow-y-auto animate-slide-up">
            <div className="p-6">
              {/* Close */}
              <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-card">
                <X className="w-5 h-5 text-text-muted" />
              </button>

              {/* Job header */}
              <div className="flex items-start gap-4 mb-6 pr-8">
                <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-text-muted" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">{selectedJob.job.title}</h2>
                  <p className="text-text-muted">{selectedJob.job.company} · {selectedJob.job.location}</p>
                  {selectedJob.job.salary_min && (
                    <p className="text-success text-sm font-medium mt-1">
                      ₹{(selectedJob.job.salary_min / 100000).toFixed(0)}L – ₹{(selectedJob.job.salary_max / 100000).toFixed(0)}L
                    </p>
                  )}
                </div>
                <MatchScore score={selectedJob.match_score} size="lg" />
              </div>

              {/* Match breakdown */}
              {selectedJob.match_reasons && (
                <div className="card mb-4">
                  <h3 className="font-semibold text-text mb-3">Match Analysis</h3>
                  <p className="text-sm text-text-muted mb-4">{selectedJob.match_reasons.summary}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-success mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Skills Matched
                      </p>
                      <div className="space-y-1">
                        {selectedJob.match_reasons.skills_matched?.map((s) => (
                          <p key={s} className="text-xs text-text bg-success/10 border border-success/20 rounded px-2 py-1">{s}</p>
                        ))}
                      </div>
                    </div>
                    {selectedJob.match_reasons.skills_missing?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-error mb-2 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Skills Missing
                        </p>
                        <div className="space-y-1">
                          {selectedJob.match_reasons.skills_missing?.map((s) => (
                            <p key={s} className="text-xs text-text bg-error/10 border border-error/20 rounded px-2 py-1">{s}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-text mb-2">Job Description</h3>
                <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">{selectedJob.job.description}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 sticky bottom-0 bg-surface pt-4 border-t border-border">
                <button
                  id={`drawer-apply-${selectedJob.job.id}`}
                  onClick={() => { handleApply(selectedJob); setSelectedJob(null); }}
                  className="btn-primary flex-1 py-3"
                >
                  ⚡ Auto Apply
                </button>
                <a
                  href={selectedJob.job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary py-3 px-4"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
