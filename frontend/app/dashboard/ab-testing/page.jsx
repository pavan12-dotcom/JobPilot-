'use client';
// app/dashboard/ab-testing/page.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jobsApi, resumeApi } from '@/lib/api';
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
      const targetId = selectedJob.id || selectedJob.job_id;
      const res = await jobsApi.abTest(targetId);
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
    <div className="flex-1 flex flex-col space-y-4 px-5 pt-3 animate-fade-in">
      
      {/* 1. Resume count warning if less than 2 */}
      {resumes.length < 2 && (
        <div className="card border-[rgba(252,211,77,0.15)] bg-[rgba(252,211,77,0.06)] flex items-start gap-2.5 py-3.5 m-0">
          <i className="ti ti-alert-triangle text-base text-[#FCD34D] mt-0.5 shrink-0"></i>
          <p className="text-[11px] text-[#8BA882] leading-relaxed">
            You only have <strong className="text-[#F0F5E8]">{resumes.length}</strong> resume uploaded. Please upload at least <strong className="text-[#FCD34D]">two resumes</strong> in the{' '}
            <Link href="/dashboard/resume" className="text-[#B8F023] underline font-bold hover:text-[#CEFF4A]">
              Resume Manager
            </Link>{' '}
            to compare them!
          </p>
        </div>
      )}

      {/* 2. Target Job Selector Dropdown Card */}
      <div className="card space-y-2.5 m-0">
        <label className="text-[9px] font-bold text-[#556B52] uppercase tracking-wider block">Select Job to Test</label>
        
        {loadingJobs ? (
          <div className="py-4 text-center text-[#8BA882] text-xs flex items-center justify-center gap-1.5">
            <i className="ti ti-refresh animate-spin text-[#B8F023]"></i> Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-4 text-center text-[#8BA882] text-xs">
            No jobs available to test. Try refreshing jobs from the dashboard.
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedJob ? (selectedJob.job_id || selectedJob.id) : ''}
              onChange={(e) => {
                const job = jobs.find(j => (j.job_id || j.id) === e.target.value);
                if (job) handleSelectJob(job);
              }}
              className="w-full bg-[#141F14] border border-[rgba(184,240,35,0.1)] rounded-xl py-2.5 pl-3 pr-10 text-xs text-[#F0F5E8] font-bold outline-none appearance-none cursor-pointer focus:border-[#B8F023]"
            >
              {jobs.map((match) => {
                const job = match.job || match;
                const id = match.job_id || match.id;
                return (
                  <option key={id} value={id}>
                    {job.title} — {job.company}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <i className="ti ti-chevron-down text-xs text-[#B8F023]"></i>
            </div>
          </div>
        )}
      </div>

      {/* 3. Selected Target details & A/B Action */}
      {selectedJob && (
        <div className="card space-y-3 m-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <span className="text-[8px] uppercase font-extrabold text-[#B8F023] tracking-wider">Target Details</span>
              <h3 className="font-extrabold text-[#F0F5E8] text-sm truncate">{(selectedJob.job || selectedJob).title}</h3>
              <p className="text-[10px] text-[#8BA882] mt-0.5 truncate">
                {(selectedJob.job || selectedJob).company} · {(selectedJob.job || selectedJob).location}
              </p>
            </div>
            <span className="badge-gray uppercase shrink-0 text-[8px] px-2 py-0.5">
              {(selectedJob.job || selectedJob).job_type?.replace('_', ' ')}
            </span>
          </div>
          
          <button
            onClick={runABTest}
            disabled={testing || resumes.length < 2}
            className="btn-primary py-2.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {testing ? (
              <>
                <i className="ti ti-loader animate-spin text-sm"></i> Comparing...
              </>
            ) : (
              <>
                <i className="ti ti-git-compare text-sm"></i> Run A/B Comparison
              </>
            )}
          </button>
        </div>
      )}

      {/* 4. A/B Test Results output */}
      {testResults ? (
        <div className="space-y-4">
          
          {/* Summary / Winner block */}
          {bestResume && (
            <div className="card border-[rgba(184,240,35,0.15)] bg-[rgba(184,240,35,0.06)] flex items-center gap-3 py-3 m-0">
              <div className="w-8 h-8 rounded-lg bg-[rgba(184,240,35,0.12)] border border-[rgba(184,240,35,0.15)] flex items-center justify-center shrink-0">
                <i className="ti ti-sparkles text-base text-[#B8F023] animate-pulse"></i>
              </div>
              <div>
                <h4 className="font-extrabold text-[#F0F5E8] text-xs">Best Match Found</h4>
                <p className="text-[10px] text-[#8BA882] mt-0.5">
                  <strong>"{bestResume.resumeLabel}"</strong> is the best match at{' '}
                  <span className="text-[#B8F023] font-extrabold">{bestResume.matchScore}%</span>.
                </p>
              </div>
            </div>
          )}

          {/* List of resume evaluation cards */}
          <div className="space-y-3">
            {testResults.map((r) => {
              const isBest = r.resumeId === bestResume?.resumeId;
              return (
                <div
                  key={r.resumeId}
                  className={`card flex flex-col gap-3 relative border m-0 ${
                    isBest
                      ? 'border-[#B8F023]/40 bg-[#1C2B1C]'
                      : 'border-[rgba(184,240,35,0.08)] bg-[#1C2B1C]/50'
                  }`}
                >
                  {isBest && (
                    <span className="absolute -top-2.5 right-4 text-[8px] font-bold uppercase text-[#B8F023] bg-[rgba(184,240,35,0.12)] border border-[#B8F023]/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <i className="ti ti-star-filled text-[8px]"></i> Recommended
                    </span>
                  )}

                  {/* Resume header details */}
                  <div className="flex items-start justify-between border-b border-[rgba(184,240,35,0.06)] pb-2">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-extrabold text-[#F0F5E8] text-xs truncate max-w-[200px]">{r.resumeLabel}</h4>
                      {r.isActive && (
                        <span className="text-[9px] text-[#4ADE80] font-bold flex items-center gap-0.5 mt-0.5">
                          <i className="ti ti-circle-check"></i> Active profile
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-extrabold text-[#B8F023] leading-none">{r.matchScore}%</div>
                      <span className="text-[8px] text-[#8BA882] uppercase tracking-wider font-bold">Match</span>
                    </div>
                  </div>

                  {r.success && r.matchReasons ? (
                    <div className="flex-1 flex flex-col gap-3 text-[10px]">
                      
                      {/* Skills Matched / Missing */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-[#4ADE80] font-bold text-[8px] uppercase tracking-wider mb-1">Matched Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {r.matchReasons.skills_matched && r.matchReasons.skills_matched.length > 0 ? (
                              r.matchReasons.skills_matched.map(s => (
                                <span key={s} className="bg-[rgba(74,222,128,0.1)] text-[#4ADE80] text-[8px] px-1.5 py-0.5 rounded font-bold">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#556B52] italic text-[8px]">None detected</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[#F87171] font-bold text-[8px] uppercase tracking-wider mb-1">Missing Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {r.matchReasons.skills_missing && r.matchReasons.skills_missing.length > 0 ? (
                              r.matchReasons.skills_missing.map(s => (
                                <span key={s} className="bg-[rgba(248,113,113,0.1)] text-[#F87171] text-[8px] px-1.5 py-0.5 rounded font-bold">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#4ADE80] text-[8px] italic font-bold">None missing</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fit & Alignment */}
                      <div className="grid grid-cols-2 gap-2 bg-[#243024]/40 p-2 rounded-lg border border-[rgba(184,240,35,0.06)] text-[9px]">
                        <div>
                          <p className="text-[#556B52] uppercase text-[7px] tracking-wider font-bold mb-0.5">Experience Fit</p>
                          <p className={`font-bold capitalize ${
                            r.matchReasons.experience_fit === 'good'
                              ? 'text-[#4ADE80]'
                              : r.matchReasons.experience_fit === 'partial'
                              ? 'text-[#FCD34D]'
                              : 'text-[#F87171]'
                          }`}>
                            {r.matchReasons.experience_fit}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#556B52] uppercase text-[7px] tracking-wider font-bold mb-0.5">Role Alignment</p>
                          <p className={`font-bold capitalize ${
                            r.matchReasons.role_alignment === 'strong'
                              ? 'text-[#4ADE80]'
                              : r.matchReasons.role_alignment === 'moderate'
                              ? 'text-[#FCD34D]'
                              : 'text-[#F87171]'
                          }`}>
                            {r.matchReasons.role_alignment}
                          </p>
                        </div>
                      </div>

                      {/* AI Evaluation Summary */}
                      <div className="space-y-0.5">
                        <p className="text-[#556B52] font-bold text-[8px] uppercase tracking-wider">AI Evaluation</p>
                        <p className="text-[#8BA882] leading-relaxed text-[10px] italic">
                          "{r.matchReasons.summary}"
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="text-[#F87171] text-center py-4 text-xs font-bold">
                      Evaluation failed: {r.error || 'Unknown error'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        <div className="card text-center py-10 text-[#8BA882] border-dashed flex flex-col items-center justify-center gap-2 m-0">
          <i className="ti ti-git-compare text-3xl text-[#556B52]"></i>
          <div>
            <h4 className="font-extrabold text-[#F0F5E8] text-xs">Ready to Compare</h4>
            <p className="text-[10px] text-[#8BA882] mt-1 px-4 leading-relaxed">
              Click the **"Run A/B Comparison"** button above to evaluate all your resumes against this job listing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
