'use client';

import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle, XCircle } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';
import MatchScore from '@/components/jobs/MatchScore';
import { jobsApi } from '@/lib/api';
import toast from 'react-hot-toast';

// Seeded Job Data fallback
const DEMO_JOBS = [
  { id: '1', job: { id: 'j1', title: 'Senior Software Engineer', company: 'Google', location: 'Bangalore', job_type: 'FULL_TIME', source: 'ADZUNA', salary_min: 2500000, salary_max: 4000000, posted_at: new Date(Date.now() - 86400000).toISOString(), description: 'Join Google and work on product design and systems used by billions.', apply_url: '#' }, match_score: 94, match_reasons: { skills_matched: ['Node.js', 'React', 'PostgreSQL'], skills_missing: [], experience_fit: 'good', summary: 'Strong match! Your Node.js and React experience fits the role.' }, is_saved: false },
  { id: '2', job: { id: 'j2', title: 'Backend Engineer (Node.js)', company: 'Swiggy', location: 'Bangalore', job_type: 'FULL_TIME', source: 'ADZUNA', salary_min: 1800000, salary_max: 3000000, posted_at: new Date(Date.now() - 172800000).toISOString(), description: 'Build APIs that power food delivery for millions.', apply_url: '#' }, match_score: 89, match_reasons: { skills_matched: ['Node.js', 'PostgreSQL', 'Redis'], skills_missing: ['Kubernetes'], experience_fit: 'good', summary: 'Excellent backend match. Node.js skills are a perfect fit.' }, is_saved: true },
  { id: '3', job: { id: 'j3', title: 'Full Stack Developer', company: 'Razorpay', location: 'Bangalore', job_type: 'FULL_TIME', source: 'ADZUNA', salary_min: 2000000, salary_max: 3500000, posted_at: new Date(Date.now() - 259200000).toISOString(), description: 'Work on payments infrastructure.', apply_url: '#' }, match_score: 86, match_reasons: { skills_matched: ['React', 'Node.js', 'TypeScript'], skills_missing: ['Go'], experience_fit: 'good', summary: 'Strong React and Node.js skills match.' }, is_saved: false },
  { id: '4', job: { id: 'j4', title: 'Remote Node.js Developer', company: 'GitLab', location: 'Remote', job_type: 'REMOTE', source: 'REMOTIVE', salary_min: 3000000, salary_max: 5000000, posted_at: new Date(Date.now() - 345600000).toISOString(), description: 'Help build the DevOps platform.', apply_url: '#' }, match_score: 85, match_reasons: { skills_matched: ['Node.js', 'Git', 'Docker'], skills_missing: ['Ruby'], experience_fit: 'good', summary: 'Good match for remote Node.js role.' }, is_saved: false },
  { id: '5', job: { id: 'j5', title: 'API Engineer', company: 'Stripe', location: 'Remote', job_type: 'REMOTE', source: 'THEMUSE', salary_min: 3500000, salary_max: 6000000, posted_at: new Date(Date.now() - 432000000).toISOString(), description: 'Build payment APIs used by millions of businesses.', apply_url: '#' }, match_score: 91, match_reasons: { skills_matched: ['Node.js', 'PostgreSQL', 'AWS'], skills_missing: [], experience_fit: 'good', summary: 'Excellent Stripe API match.' }, is_saved: false },

];

export default function JobsPage() {
  const [jobs, setJobs] = useState(DEMO_JOBS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Custom Filter State
  const [filterLocation, setFilterLocation] = useState('Anywhere');
  const [filterType, setFilterType] = useState('All types');
  
  // Tabs in job detail screen
  const [detailTab, setDetailTab] = useState('about'); // 'about' | 'requirements'

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    try {
      const res = await jobsApi.getRecommended({ limit: 20 });
      if (res.data?.length > 0) {
        setJobs(res.data);
      }
    } catch {
      // Keep fallbacks
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
      toast.success(res.data.is_saved ? 'Job saved!' : 'Job removed from saves');
    } catch { 
      toast.error('Failed to save job'); 
    }
  }

  async function handleApply(match) {
    try {
      await jobsApi.apply(match.job.id || match.id);
      toast.success('Auto-Apply execution queued successfully!');
    } catch (err) { 
      toast.error(err?.error || 'Failed to trigger application queue'); 
    }
  }

  // Filter items matching location chips & types
  const filteredJobs = jobs.filter((m) => {
    // Search filter
    if (search && 
        !m.job.title.toLowerCase().includes(search.toLowerCase()) &&
        !m.job.company.toLowerCase().includes(search.toLowerCase())) return false;
    
    // Location filter
    if (filterLocation !== 'Anywhere') {
      const loc = m.job.location.toLowerCase();
      if (filterLocation === 'Remote' && !loc.includes('remote')) return false;
      if (filterLocation === 'Hybrid' && !loc.includes('hybrid')) return false;
      if (filterLocation === 'On-site' && (loc.includes('remote') || loc.includes('hybrid'))) return false;
    }

    // Type filter
    if (filterType !== 'All types') {
      const type = m.job.job_type.toLowerCase();
      if (filterType === 'Full-time' && !type.includes('full')) return false;
      if (filterType === 'Contract' && !type.includes('contract')) return false;
    }

    return true;
  });

  // Render JOB DETAIL SCREEN if one is selected
  if (selectedJob) {
    const { job, match_score, match_reasons, is_saved } = selectedJob;
    return (
      <div className="flex-1 flex flex-col bg-[#141F14] animate-fade-in -mx-5 -mt-3 h-full">
        {/* Detail topbar wrapper */}
        <div className="det-topbar flex items-center justify-between p-4 bg-[#141F14] border-b border-[rgba(184,240,35,0.1)]">
          <button className="bk-btn" onClick={() => setSelectedJob(null)}>
            <i className="ti ti-arrow-left text-lg text-[#F0F5E8]"></i>
          </button>
          <span className="text-xs font-bold text-[#F0F5E8]">Job Detail</span>
          <button 
            className={`bk-btn ${is_saved ? 'bg-[#B8F023] border-[#B8F023]' : ''}`}
            onClick={() => handleSave(selectedJob)}
          >
            <i className={`ti ti-bookmark text-sm ${is_saved ? 'text-[#141F14]' : 'text-[#F0F5E8]'}`}></i>
          </button>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24">
          <div className="text-center mb-6">
            <div className="det-logo w-16 h-16 rounded-2xl bg-[#B8F023]/10 border border-[rgba(184,240,35,0.15)] flex items-center justify-center font-extrabold text-xl text-[#B8F023] mx-auto mb-3">
              {job.company?.[0]?.toUpperCase() || 'J'}
            </div>
            <h2 className="text-lg font-extrabold text-[#F0F5E8] leading-snug">{job.title}</h2>
            <p className="text-xs text-[#8BA882] mt-1 font-medium">{job.company} · {job.location}</p>
          </div>

          {/* Quick stats row */}
          <div className="det-stats flex border border-[rgba(184,240,35,0.1)] rounded-xl bg-[#1C2B1C] mb-5 overflow-hidden">
            <div className="dsi flex-1 py-3 text-center border-r border-[rgba(184,240,35,0.08)]">
              <p className="dsv text-xs font-bold text-[#B8F023]">
                {job.salary_min ? `₹${(job.salary_min/100000).toFixed(0)}L` : 'N/A'}
              </p>
              <p className="dsl text-[9px] text-[#556B52] uppercase font-bold mt-0.5">Salary</p>
            </div>
            <div className="dsi flex-1 py-3 text-center border-r border-[rgba(184,240,35,0.08)]">
              <p className="dsv text-xs font-bold text-[#B8F023] capitalize">{job.job_type?.replace('_', ' ').toLowerCase()}</p>
              <p className="dsl text-[9px] text-[#556B52] uppercase font-bold mt-0.5">Work Type</p>
            </div>
            <div className="dsi flex-1 py-3 text-center">
              <p className="dsv text-xs font-bold text-[#B8F023]">{match_score}%</p>
              <p className="dsl text-[9px] text-[#556B52] uppercase font-bold mt-0.5">AI Score</p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="dtabs flex border-b border-[rgba(184,240,35,0.08)] mb-4">
            <button 
              className={`dtab flex-1 py-2 text-center text-xs font-bold border-b-2 bg-transparent cursor-pointer ${
                detailTab === 'about' ? 'text-[#B8F023] border-[#B8F023]' : 'text-[#556B52] border-transparent'
              }`}
              onClick={() => setDetailTab('about')}
            >
              Description
            </button>
            <button 
              className={`dtab flex-1 py-2 text-center text-xs font-bold border-b-2 bg-transparent cursor-pointer ${
                detailTab === 'requirements' ? 'text-[#B8F023] border-[#B8F023]' : 'text-[#556B52] border-transparent'
              }`}
              onClick={() => setDetailTab('requirements')}
            >
              Match Analysis
            </button>
          </div>

          {/* Tab content: About/Description */}
          {detailTab === 'about' && (
            <div className="space-y-4 text-xs text-[#8BA882] leading-relaxed">
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {/* Tab content: Requirements/Match */}
          {detailTab === 'requirements' && (
            <div className="space-y-4">
              {match_reasons && (
                <>
                  <div className="p-4 rounded-xl border border-[rgba(184,240,35,0.1)] bg-[#1C2B1C] space-y-2 text-xs">
                    <p className="font-bold text-[#F0F5E8]">Evaluation Summary</p>
                    <p className="text-[#8BA882] italic leading-relaxed">"{match_reasons.summary}"</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#4ADE80] mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Matched Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {match_reasons.skills_matched?.map(s => (
                          <span key={s} className="bg-[rgba(74,222,128,0.1)] text-[#4ADE80] border border-[rgba(74,222,128,0.15)] text-[10px] px-2.5 py-1 rounded-md font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {match_reasons.skills_missing?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#F87171] mb-2 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Missing Experience Tags
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {match_reasons.skills_missing?.map(s => (
                            <span key={s} className="bg-[rgba(248,113,113,0.1)] text-[#F87171] border border-[rgba(248,113,113,0.15)] text-[10px] px-2.5 py-1 rounded-md font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Apply bottom action bar */}
        <div className="apply-bar absolute bottom-0 left-0 right-0 p-4 border-t border-[rgba(184,240,35,0.1)] bg-[#141F14] flex gap-3 items-center z-10">
          <div className="sal-disp">
            <span className="sal-amt block text-base font-extrabold text-[#B8F023]">
              {job.salary_min ? `₹${(job.salary_min/100000).toFixed(0)}L` : 'Hourly'}
            </span>
            <span className="sal-per text-[9px] text-[#556B52] font-semibold">Matched Salary Est.</span>
          </div>
          <button 
            onClick={() => { handleApply(selectedJob); setSelectedJob(null); }}
            className="apply-btn-full flex-1 bg-[#B8F023] hover:bg-[#CEFF4A] text-[#141F14] border-none py-3 rounded-full text-xs font-extrabold cursor-pointer"
          >
            ⚡ Auto Apply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Search Input Box */}
      <div className="srch-inp-wrap px-5 pt-3">
        <div className="srch-inp flex gap-2.5 items-center bg-[#1C2B1C] border border-[#B8F023]/60 rounded-full py-3 px-4 shadow-[0_0_0_4px_rgba(184,240,35,0.06)]">
          <i className="ti ti-search text-base text-[#B8F023]"></i>
          <input
            id="job-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job title, skill, company…"
            className="flex-1 border-none bg-transparent outline-none text-xs text-[#F0F5E8]"
          />
        </div>
      </div>

      {/* Location Filter Section */}
      <div className="f-sec px-5">
        <div className="f-lbl text-[9px] font-bold text-[#556B52] uppercase tracking-wider mb-2">Location</div>
        <div className="f-chips flex gap-1.5 flex-wrap">
          {['Anywhere', 'Remote', 'Hybrid', 'On-site'].map((loc) => (
            <button
              key={loc}
              onClick={() => setFilterLocation(loc)}
              className={`fchip py-1.5 px-3.5 text-[10px] font-bold rounded-full border bg-transparent cursor-pointer transition-all ${
                filterLocation === loc 
                  ? 'bg-[#B8F023] text-[#141F14] border-[#B8F023]' 
                  : 'border-[rgba(184,240,35,0.1)] text-[#8BA882] hover:border-[#B8F023]/30'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Type Filter Section */}
      <div className="f-sec px-5">
        <div className="f-lbl text-[9px] font-bold text-[#556B52] uppercase tracking-wider mb-2">Job Type</div>
        <div className="f-chips flex gap-1.5 flex-wrap">
          {['All types', 'Full-time', 'Contract'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`fchip py-1.5 px-3.5 text-[10px] font-bold rounded-full border bg-transparent cursor-pointer transition-all ${
                filterType === type 
                  ? 'bg-[#B8F023] text-[#141F14] border-[#B8F023]' 
                  : 'border-[rgba(184,240,35,0.1)] text-[#8BA882] hover:border-[#B8F023]/30'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="res-count px-5 text-xs text-[#8BA882] border-t border-[rgba(184,240,35,0.06)] pt-3 flex items-center justify-between">
        <span>Found <strong className="text-[#B8F023] font-extrabold">{filteredJobs.length}</strong> matches</span>
        {search || filterLocation !== 'Anywhere' || filterType !== 'All types' ? (
          <button 
            onClick={() => { setSearch(''); setFilterLocation('Anywhere'); setFilterType('All types'); }}
            className="text-[10px] text-[#B8F023] hover:underline bg-transparent border-none cursor-pointer font-bold"
          >
            Clear Filters
          </button>
        ) : null}
      </div>

      {/* Recommended Jobs List */}
      <div className="flex-1 space-y-3 px-5">
        {loading ? (
          <div className="text-center py-10">
            <RefreshCcw className="w-5 h-5 animate-spin mx-auto text-[#B8F023] mb-2" />
            <p className="text-xs text-[#8BA882]">Loading recommendations...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="card text-center py-12 border-dashed">
            <Briefcase className="w-8 h-8 text-[#556B52] mx-auto mb-2" />
            <p className="text-xs text-[#8BA882]">No matching roles found.</p>
          </div>
        ) : (
          filteredJobs.map((match) => (
            <JobCard
              key={match.id || match.job.id}
              match={match}
              onSave={handleSave}
              onApply={handleApply}
              onClick={setSelectedJob}
            />
          ))
        )}
      </div>
    </div>
  );
}
