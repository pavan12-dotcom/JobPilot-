'use client';
// app/dashboard/ab-testing/page.jsx
import { useState, useEffect } from 'react';
import { jobsApi, resumeApi } from '@/lib/api';
import { GitCompare, FileText, CheckCircle, AlertCircle, RefreshCw, ChevronRight, Sparkles, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ABTestingPage() {
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    fetchJobsAndResumes();
  }, []);

  async function fetchJobsAndResumes() {
    setLoadingJobs(true);
    try {
      // Fetch recommended jobs
      const jobsRes = await jobsApi.getRecommended({ limit: 10 });
      setJobs(jobsRes.data || []);
      
      // Fetch resumes
      const resumesRes = await resumeApi.getAll();
      setResumes(resumesRes.data || []);

      if (jobsRes.data?.length > 0) {
        setSelectedJob(jobsRes.data[0]);
      }
    } catch (err) {
      toast.error('Failed to load initial data');
    } finally {
      setLoadingJobs(false);
    }
  }

  async function runABTest() {
    if (!selectedJob) return;
    setTesting(true);
    setTestResults(null);
    try {
      const res = await jobsApi.abTest(selectedJob.id || selectedJob.job_id);
      setTestResults(res.data.results || []);
      toast.success('A/B comparison complete!');
    } catch (err) {
      toast.error(err.message || 'A/B testing failed');
    } finally {
      setTesting(false);
    }
  }

  // Handle job selection and reset previous results
  function handleSelectJob(job) {
    setSelectedJob(job);
    setTestResults(null);
  }

  // Find the highest scoring resume
  const bestResume = testResults
    ? [...testResults].filter(r => r.success).sort((a, b) => b.matchScore - a.matchScore)[0]
    : null;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-primary" /> Resume A/B Testing
        </h2>
        <p className="text-text-muted text-sm">Compare match scores of all your resumes against job listings side-by-side</p>
      </div>

      {resumes.length < 2 && (
        <div className="card border-warning/30 bg-warning/5 text-warning flex items-center gap-3 p-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            You only have {resumes.length} resume uploaded. Please upload at least <strong>two resumes</strong> in the{' '}
            <a href="/dashboard/resume" className="underline font-semibold hover:text-warning-hover">
              Resume Manager
            </a>{' '}
            to compare them!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Job Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card space-y-4">
            <h3 className="font-semibold text-text text-sm">Select Job to Test</h3>
            
            {loadingJobs ? (
              <div className="py-8 text-center text-text-muted text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" /> Loading jobs...
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">
                No jobs available to test. Try refreshing jobs from the dashboard.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {jobs.map((match) => {
                  const job = match.job || match; // Handle different API response nesting
                  const id = match.job_id || match.id;
                  const isSelected = selectedJob?.id === id || selectedJob?.job_id === id;
                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectJob(match)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border-hover bg-surface/50'
                      }`}
                    >
                      <h4 className="font-semibold text-text text-sm truncate">{job.title}</h4>
                      <p className="text-xs text-text-muted truncate">{job.company} · {job.location}</p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-text-subtle">
                        <span className="badge-gray uppercase">{job.job_type}</span>
                        {match.match_score && <span>Active Score: {match.match_score}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Comparison view */}
        <div className="lg:col-span-2 space-y-6">
          {selectedJob ? (
            <div className="space-y-4">
              
              {/* Selected Job details card */}
              <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/50">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Target Job Details</span>
                  <h3 className="font-bold text-text text-lg truncate">{(selectedJob.job || selectedJob).title}</h3>
                  <p className="text-xs text-text-muted truncate">
                    {(selectedJob.job || selectedJob).company} · {(selectedJob.job || selectedJob).location}
                  </p>
                </div>
                <button
                  onClick={runABTest}
                  disabled={testing || resumes.length < 2}
                  className="btn-primary gap-1.5 self-start md:self-auto"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Comparing...
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-4 h-4" /> Run A/B Comparison
                    </>
                  )}
                </button>
              </div>

              {/* A/B Test Results output */}
              {testResults ? (
                <div className="space-y-6">
                  
                  {/* Summary / Winner block */}
                  {bestResume && (
                    <div className="card border-primary/20 bg-primary/5 flex items-center gap-4 py-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text text-sm">Best Matching Resume Found</h4>
                        <p className="text-xs text-text-muted mt-0.5">
                          <strong>"{bestResume.resumeLabel}"</strong> scored the highest match rate at{' '}
                          <span className="text-primary font-bold">{bestResume.matchScore}%</span>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Side-by-side cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testResults.map((r, i) => (
                      <div
                        key={r.resumeId}
                        className={`card flex flex-col gap-4 relative border ${
                          r.resumeId === bestResume?.resumeId
                            ? 'border-primary shadow-sm bg-surface'
                            : 'border-border bg-surface/40'
                        }`}
                      >
                        {r.resumeId === bestResume?.resumeId && (
                          <span className="absolute -top-3 left-4 text-[10px] font-bold uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-primary text-primary" /> Recommended
                          </span>
                        )}

                        {/* Resume header details */}
                        <div className="flex items-start justify-between border-b border-border/50 pb-3">
                          <div>
                            <h4 className="font-bold text-text text-sm truncate">{r.resumeLabel}</h4>
                            {r.isActive && (
                              <span className="text-[10px] text-success font-medium flex items-center gap-0.5 mt-0.5">
                                <CheckCircle className="w-3 h-3" /> Active profile
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-extrabold text-text leading-none">{r.matchScore}%</div>
                            <span className="text-[10px] text-text-muted">Match Score</span>
                          </div>
                        </div>

                        {r.success && r.matchReasons ? (
                          <div className="flex-1 flex flex-col gap-4 text-xs">
                            
                            {/* Skills Matched / Missing */}
                            <div className="space-y-3">
                              <div>
                                <p className="text-success font-bold text-[10px] uppercase mb-1">Matched Skills</p>
                                <div className="flex flex-wrap gap-1">
                                  {r.matchReasons.skills_matched && r.matchReasons.skills_matched.length > 0 ? (
                                    r.matchReasons.skills_matched.map(s => (
                                      <span key={s} className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded">
                                        {s}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-text-subtle italic">None detected</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-error font-bold text-[10px] uppercase mb-1">Missing Skills</p>
                                <div className="flex flex-wrap gap-1">
                                  {r.matchReasons.skills_missing && r.matchReasons.skills_missing.length > 0 ? (
                                    r.matchReasons.skills_missing.map(s => (
                                      <span key={s} className="bg-error/10 text-error text-[10px] px-2 py-0.5 rounded">
                                        {s}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-success-hover text-[10px] italic">No missing critical skills</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Fit & Alignment */}
                            <div className="grid grid-cols-2 gap-3 bg-surface p-2.5 rounded-lg border border-border/50 text-[11px]">
                              <div>
                                <p className="text-text-muted uppercase text-[9px] tracking-wider mb-0.5">Experience Fit</p>
                                <p className={`font-bold capitalize ${
                                  r.matchReasons.experience_fit === 'good'
                                    ? 'text-success'
                                    : r.matchReasons.experience_fit === 'partial'
                                    ? 'text-warning'
                                    : 'text-error'
                                }`}>
                                  {r.matchReasons.experience_fit}
                                </p>
                              </div>
                              <div>
                                <p className="text-text-muted uppercase text-[9px] tracking-wider mb-0.5">Role Alignment</p>
                                <p className={`font-bold capitalize ${
                                  r.matchReasons.role_alignment === 'strong'
                                    ? 'text-success'
                                    : r.matchReasons.role_alignment === 'moderate'
                                    ? 'text-warning'
                                    : 'text-error'
                                }`}>
                                  {r.matchReasons.role_alignment}
                                </p>
                              </div>
                            </div>

                            {/* Summary */}
                            <div className="space-y-1 mt-auto">
                              <p className="text-text-muted font-bold text-[9px] uppercase">AI Evaluation</p>
                              <p className="text-text-muted leading-relaxed text-[11px] italic">
                                "{r.matchReasons.summary}"
                              </p>
                            </div>

                          </div>
                        ) : (
                          <div className="text-error text-center py-6 text-xs">
                            Evaluation failed: {r.error || 'Unknown error'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="card text-center py-16 text-text-muted border-dashed flex flex-col items-center justify-center gap-3">
                  <GitCompare className="w-12 h-12 text-text-subtle" />
                  <div>
                    <h4 className="font-bold text-text">Ready to Compare</h4>
                    <p className="text-sm text-text-muted mt-1">
                      Click the **"Run A/B Comparison"** button above to evaluate all your resumes against this job listing.
                    </p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="card text-center py-20 text-text-muted border-dashed flex flex-col items-center justify-center gap-3 animate-pulse">
              <FileText className="w-12 h-12 text-text-subtle" />
              <div>
                <h4 className="font-bold text-text font-medium">Select a Job</h4>
                <p className="text-sm text-text-muted mt-1">Choose a job listing on the left to start comparisons.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
