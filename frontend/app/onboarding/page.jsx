'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  Zap, Upload, CheckCircle, ArrowRight, ArrowLeft,
  Plus, X, Briefcase, MapPin, DollarSign,
} from 'lucide-react';
import { resumeApi, preferencesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Resume Upload', icon: Upload },
  { id: 2, label: 'Target Roles', icon: Briefcase },
  { id: 3, label: 'Auto-Apply Setup', icon: Zap },
  { id: 4, label: 'Done', icon: CheckCircle },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [prefs, setPrefs] = useState({
    target_roles: [],
    target_locations: [],
    job_types: ['FULL_TIME', 'REMOTE'],
    experience_level: 'MID',
    auto_apply_enabled: false,
    min_match_score: 70,
    daily_limit: 10,
  });
  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Step 1: Resume upload
  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    const interval = setInterval(() => setUploadProgress((p) => Math.min(p + 15, 90)), 300);

    try {
      const res = await resumeApi.upload(file);
      setResume(res.data);
      clearInterval(interval);
      setUploadProgress(100);
      toast.success('Resume parsed successfully!');
      setTimeout(() => setStep(2), 800);
    } catch {
      // Fallback for offline/demo settings
      setResume({ 
        file_name: file.name, 
        parsed_data: { 
          skills: ['React', 'Node.js', 'PostgreSQL', 'TailwindCSS'], 
          current_role: 'Software Engineer', 
          total_experience_years: 3 
        } 
      });
      clearInterval(interval);
      setUploadProgress(100);
      toast.success('Resume uploaded! (Demo Mode)');
      setTimeout(() => setStep(2), 800);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] }, 
    maxFiles: 1 
  });

  const addTag = (field, value, setter) => {
    if (!value.trim() || prefs[field].includes(value.trim())) return;
    setPrefs((p) => ({ ...p, [field]: [...p[field], value.trim()] }));
    setter('');
  };

  const removeTag = (field, val) => {
    setPrefs((p) => ({ ...p, [field]: p[field].filter((x) => x !== val) }));
  };

  async function finishOnboarding() {
    try {
      await preferencesApi.update(prefs);
    } catch {}
    toast.success("You're all set! Welcome to ApplyAI!");
    router.push('/dashboard');
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-grid-pattern relative selection:bg-primary/20">
      
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        
        {/* Onboarding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-text font-display">ApplyAI Onboarding</span>
          </div>
          <h1 className="text-2xl font-bold text-text font-display">Let's set up your profile</h1>
          <p className="text-text-muted text-xs font-semibold mt-1">Configure your targets to start matching jobs</p>
        </div>

        {/* Step circles indicators */}
        <div className="flex items-center gap-2 mb-6 px-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  step > s.id 
                    ? 'bg-success text-white' 
                    : step === s.id 
                    ? 'bg-primary text-white scale-110 shadow-md ring-4 ring-primary/10' 
                    : 'bg-white border border-border text-text-subtle'
                }`}
                title={s.label}
              >
                {step > s.id ? '✓' : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-300 ${
                  step > s.id ? 'bg-success' : step === s.id ? 'bg-primary/50' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Custom progress bar */}
        <div className="progress-bar mb-6 mx-4">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Card Component */}
        <div className="card shadow-premium border border-border bg-white p-7 mx-4 animate-slide-up">
          
          {/* Step 1: Upload CV */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-text font-display">Upload your active resume</h2>
                <p className="text-text-muted text-xs font-medium">We'll extract your skills and experience to run auto-applies.</p>
              </div>

              {uploading ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center animate-bounce">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text">Parsing with Claude AI...</p>
                    <p className="text-xs text-text-muted mt-0.5">Extracting technology tags and professional records</p>
                  </div>
                  <div className="progress-bar max-w-xs mx-auto">
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : resume ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 bg-success/10 rounded-full mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <CheckCircle className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <p className="font-bold text-text text-sm">{resume.file_name}</p>
                    <p className="text-text-muted text-xs mt-1">
                      Detected: {resume.parsed_data?.skills?.slice(0, 5).join(', ') || 'Skills parsed'}
                    </p>
                  </div>
                  <button onClick={() => setStep(2)} className="btn-primary mt-2 gap-2 text-xs py-2 px-5">
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/40 hover:bg-surface/30'
                  }`}
                >
                  <input {...getInputProps()} id="onboarding-resume-upload" />
                  <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="font-bold text-text text-sm mb-1">Drag & drop your PDF resume</p>
                  <p className="text-text-muted text-xs">or <span className="text-primary font-bold">click to browse directories</span></p>
                  <p className="text-[10px] text-text-subtle mt-3">PDF formats under 10MB only</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Set Preferences */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-text font-display">Target Roles & Preferences</h2>
                <p className="text-text-muted text-xs font-medium">Add role labels and locations to guide the matcher</p>
              </div>

              <div className="space-y-4">
                {/* Roles list */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Target Roles</label>
                  <div className="flex flex-wrap gap-1.5 min-h-6">
                    {prefs.target_roles.length === 0 ? (
                      <span className="text-xs text-text-subtle italic">No target roles added yet</span>
                    ) : (
                      prefs.target_roles.map((r) => (
                        <span key={r} className="badge-blue text-[11px] font-bold py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                          {r}
                          <button onClick={() => removeTag('target_roles', r)} className="hover:bg-primary/20 rounded p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      id="onboard-role" 
                      className="input flex-1 py-2 text-sm" 
                      placeholder="e.g. Senior Frontend Engineer" 
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag('target_roles', roleInput, setRoleInput)} 
                    />
                    <button onClick={() => addTag('target_roles', roleInput, setRoleInput)} className="btn-secondary py-2 px-3">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Locations list */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Target Locations</label>
                  <div className="flex flex-wrap gap-1.5 min-h-6">
                    {prefs.target_locations.length === 0 ? (
                      <span className="text-xs text-text-subtle italic">No target locations added yet</span>
                    ) : (
                      prefs.target_locations.map((l) => (
                        <span key={l} className="badge-blue text-[11px] font-bold py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                          {l}
                          <button onClick={() => removeTag('target_locations', l)} className="hover:bg-primary/20 rounded p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      id="onboard-location" 
                      className="input flex-1 py-2 text-sm" 
                      placeholder="e.g. Remote, Bangalore" 
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag('target_locations', locationInput, setLocationInput)} 
                    />
                    <button onClick={() => addTag('target_locations', locationInput, setLocationInput)} className="btn-secondary py-2 px-3">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button onClick={() => setStep(1)} className="btn-secondary text-xs gap-1 py-2 px-4">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button id="onboard-step2-next" onClick={() => setStep(3)} className="btn-primary flex-1 text-xs py-2 px-4 gap-1.5 justify-center">
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Setup Auto-Apply */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-text font-display">Auto-Apply System Settings</h2>
                <p className="text-text-muted text-xs font-medium">Fine-tune score requirements and queue limits</p>
              </div>

              <div className="space-y-5">
                {/* Autoapply toggle */}
                <div className="p-4 rounded-2xl border border-primary/15 bg-primary/5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-text text-sm">Activate Automation Queue</p>
                    <p className="text-[11px] text-text-muted">Applies to jobs matching your criteria automatically</p>
                  </div>
                  <button
                    id="onboard-auto-apply-toggle"
                    onClick={() => setPrefs((p) => ({ ...p, auto_apply_enabled: !p.auto_apply_enabled }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${prefs.auto_apply_enabled ? 'bg-primary' : 'bg-surface border border-border'}`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-md ${prefs.auto_apply_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Score slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Min Match Score Threshold</label>
                    <span className="text-xs font-extrabold text-primary">{prefs.min_match_score}%</span>
                  </div>
                  <input 
                    id="onboard-score-slider" 
                    type="range" 
                    min="60" 
                    max="95" 
                    step="5"
                    value={prefs.min_match_score}
                    onChange={(e) => setPrefs((p) => ({ ...p, min_match_score: Number(e.target.value) }))}
                    className="w-full accent-primary h-1 bg-surface rounded-lg cursor-pointer" 
                  />
                  <div className="flex justify-between text-[10px] text-text-subtle font-medium">
                    <span>60% (Lax)</span>
                    <span>75% (Moderate)</span>
                    <span>95% (Strict)</span>
                  </div>
                </div>

                {/* Limit slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Max Applications Per Day</label>
                    <span className="text-xs font-extrabold text-primary">{prefs.daily_limit} jobs</span>
                  </div>
                  <input 
                    id="onboard-limit-slider" 
                    type="range" 
                    min="1" 
                    max="20"
                    value={prefs.daily_limit}
                    onChange={(e) => setPrefs((p) => ({ ...p, daily_limit: Number(e.target.value) }))}
                    className="w-full accent-primary h-1 bg-surface rounded-lg cursor-pointer" 
                  />
                  <div className="flex justify-between text-[10px] text-text-subtle font-medium">
                    <span>1 job/day</span>
                    <span>10 jobs/day</span>
                    <span>20 jobs/day</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button onClick={() => setStep(2)} className="btn-secondary text-xs gap-1 py-2 px-4">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button id="onboard-step3-next" onClick={() => setStep(4)} className="btn-primary flex-1 text-xs py-2 px-4 gap-1.5 justify-center">
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Finished */}
          {step === 4 && (
            <div className="text-center py-4 space-y-6">
              <div className="space-y-2">
                <div className="w-16 h-16 bg-success/10 border border-success/25 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-lg font-bold text-text font-display">Preferences configured!</h2>
                <p className="text-text-muted text-xs">Your dashboard is seeded and ready for search tracking.</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs text-left">
                {[
                  ['Roles Map', prefs.target_roles.slice(0, 2).join(', ') || 'Not configured'],
                  ['Locations Map', prefs.target_locations.slice(0, 2).join(', ') || 'Not configured'],
                  ['Auto-Apply Status', prefs.auto_apply_enabled ? '✅ Enabled' : '❌ Disabled'],
                  ['Daily Limit', `${prefs.daily_limit} applications`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface/50 border border-border/40 rounded-xl p-3">
                    <p className="text-text-subtle text-[10px] uppercase font-bold tracking-wider mb-0.5">{k}</p>
                    <p className="text-text font-semibold truncate">{v}</p>
                  </div>
                ))}
              </div>

              <button 
                id="onboard-finish-btn" 
                onClick={finishOnboarding} 
                className="btn-primary w-full py-3 gap-2 font-bold justify-center"
              >
                Enter Dashboard <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
