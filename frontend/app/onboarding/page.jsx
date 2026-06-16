'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { resumeApi, preferencesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Resume', icon: 'ti ti-upload' },
  { id: 2, label: 'Roles', icon: 'ti ti-briefcase' },
  { id: 3, label: 'Auto-Apply', icon: 'ti ti-zap' },
  { id: 4, label: 'Done', icon: 'ti ti-checkbox' },
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
    toast.success("Welcome to JobPilot!");
    router.push('/dashboard');
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="flex-1 flex flex-col px-5 py-6 bg-[#141F14]">
      {/* Wizard Indicators */}
      <div className="flex items-center gap-2 mb-5 mt-2 px-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                step > s.id 
                  ? 'bg-[#4ADE80] text-[#141F14]' 
                  : step === s.id 
                  ? 'bg-[#B8F023] text-[#141F14] scale-110 shadow-md ring-4 ring-[#B8F023]/10' 
                  : 'bg-[#1C2B1C] border border-[rgba(184,240,35,0.15)] text-[#556B52]'
              }`}
              title={s.label}
            >
              {step > s.id ? '✓' : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-300 ${
                step > s.id ? 'bg-[#4ADE80]' : step === s.id ? 'bg-[#B8F023]/40' : 'bg-[rgba(184,240,35,0.10)]'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar fill */}
      <div className="progress-bar mb-6">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col justify-between">
        
        {/* Step 1: Upload CV */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#F0F5E8] tracking-tight">Upload active resume</h2>
              <p className="text-[#8BA882] text-xs mt-0.5 font-medium">Extract skills to trigger applications.</p>
            </div>

            {uploading ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 bg-[#B8F023]/10 border border-[#B8F023]/25 rounded-2xl mx-auto flex items-center justify-center animate-bounce">
                  <i className="ti ti-upload text-xl text-[#B8F023]"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F0F5E8]">Parsing with Claude AI...</p>
                  <p className="text-[11px] text-[#8BA882] mt-0.5">Reading PDF structure</p>
                </div>
                <div className="progress-bar max-w-xs mx-auto">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : resume ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 bg-[rgba(74,222,128,0.1)] rounded-full mx-auto flex items-center justify-center border border-[rgba(74,222,128,0.2)]">
                  <i className="ti ti-circle-check text-2xl text-[#4ADE80]"></i>
                </div>
                <div>
                  <p className="font-bold text-[#F0F5E8] text-sm">{resume.file_name}</p>
                  <p className="text-[#8BA882] text-[11px] mt-1">
                    Skills: {resume.parsed_data?.skills?.slice(0, 3).join(', ') || 'Parsed'}
                  </p>
                </div>
                <button onClick={() => setStep(2)} className="btn-primary mt-2 gap-2 text-xs py-2 px-5 max-w-xs mx-auto">
                  Continue <i className="ti ti-arrow-right"></i>
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragActive 
                    ? 'border-[#B8F023] bg-[#B8F023]/5' 
                    : 'border-[rgba(184,240,35,0.15)] hover:border-[#B8F023]/40 hover:bg-[#1C2B1C]/30'
                }`}
              >
                <input {...getInputProps()} id="onboarding-resume-upload" />
                <i className="ti ti-upload text-3xl text-[#B8F023] mx-auto mb-3 block"></i>
                <p className="font-bold text-[#F0F5E8] text-sm mb-1">Drag & drop your PDF resume</p>
                <p className="text-[#8BA882] text-xs">or <span className="text-[#B8F023] font-bold">browse directories</span></p>
                <p className="text-[10px] text-[#556B52] mt-3">PDF format under 10MB</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Roles */}
        {step === 2 && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#F0F5E8] tracking-tight">Preferences & tags</h2>
                <p className="text-[#8BA882] text-xs mt-0.5 font-medium">Add roles and locations to match</p>
              </div>

              {/* Roles Tag box */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8BA882]">Target Roles</label>
                <div className="flex flex-wrap gap-1.5 min-h-6">
                  {prefs.target_roles.length === 0 ? (
                    <span className="text-xs text-[#556B52] italic">No target roles added</span>
                  ) : (
                    prefs.target_roles.map((r) => (
                      <span key={r} className="badge-blue text-[10px] font-bold py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                        {r}
                        <button onClick={() => removeTag('target_roles', r)} className="hover:bg-[#B8F023]/20 rounded p-0.5">
                          <i className="ti ti-x text-[9px] text-[#B8F023]"></i>
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    id="onboard-role" 
                    className="input flex-1 py-2 text-xs" 
                    placeholder="e.g. Frontend Specialist" 
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag('target_roles', roleInput, setRoleInput)} 
                  />
                  <button onClick={() => addTag('target_roles', roleInput, setRoleInput)} className="btn-secondary py-2 px-3 w-auto rounded-full">
                    <i className="ti ti-plus"></i>
                  </button>
                </div>
              </div>

              {/* Locations Tag box */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8BA882]">Locations</label>
                <div className="flex flex-wrap gap-1.5 min-h-6">
                  {prefs.target_locations.length === 0 ? (
                    <span className="text-xs text-[#556B52] italic">No target locations added</span>
                  ) : (
                    prefs.target_locations.map((l) => (
                      <span key={l} className="badge-blue text-[10px] font-bold py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                        {l}
                        <button onClick={() => removeTag('target_locations', l)} className="hover:bg-[#B8F023]/20 rounded p-0.5">
                          <i className="ti ti-x text-[9px] text-[#B8F023]"></i>
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    id="onboard-location" 
                    className="input flex-1 py-2 text-xs" 
                    placeholder="e.g. Remote, Hyderabad" 
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag('target_locations', locationInput, setLocationInput)} 
                  />
                  <button onClick={() => addTag('target_locations', locationInput, setLocationInput)} className="btn-secondary py-2 px-3 w-auto rounded-full">
                    <i className="ti ti-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[rgba(184,240,35,0.08)]">
              <button onClick={() => setStep(1)} className="btn-secondary text-xs gap-1 py-2.5 px-4 w-auto rounded-full">
                <i className="ti ti-arrow-left"></i>
              </button>
              <button id="onboard-step2-next" onClick={() => setStep(3)} className="btn-primary flex-1 text-xs py-2.5 gap-1.5 justify-center">
                Continue <i className="ti ti-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Autoapply settings */}
        {step === 3 && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#F0F5E8] tracking-tight">Auto-Apply setups</h2>
                <p className="text-[#8BA882] text-xs mt-0.5 font-medium">Fine-tune application controls</p>
              </div>

              <div className="space-y-5">
                {/* Autoapply card */}
                <div className="p-4 rounded-2xl border border-[rgba(184,240,35,0.15)] bg-[#1C2B1C] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#F0F5E8] text-xs">Activate Automation Queue</p>
                    <p className="text-[10px] text-[#8BA882]">Applies to jobs matching filters</p>
                  </div>
                  <button
                    id="onboard-auto-apply-toggle"
                    onClick={() => setPrefs((p) => ({ ...p, auto_apply_enabled: !p.auto_apply_enabled }))}
                    className={`w-11 h-6 rounded-full transition-colors relative border border-transparent ${
                      prefs.auto_apply_enabled ? 'bg-[#B8F023]' : 'bg-[#243024]'
                    }`}
                  >
                    <span className={`block w-4 h-4 bg-[#141F14] rounded-full absolute top-0.5 transition-transform shadow-md ${
                      prefs.auto_apply_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Score slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8BA882]">Min Match Score</label>
                    <span className="text-xs font-extrabold text-[#B8F023]">{prefs.min_match_score}%</span>
                  </div>
                  <input 
                    id="onboard-score-slider" 
                    type="range" 
                    min="60" 
                    max="95" 
                    step="5"
                    value={prefs.min_match_score}
                    onChange={(e) => setPrefs((p) => ({ ...p, min_match_score: Number(e.target.value) }))}
                    className="w-full h-1" 
                  />
                  <div className="flex justify-between text-[9px] text-[#556B52] font-semibold">
                    <span>60% (Lax)</span>
                    <span>75% (Medium)</span>
                    <span>95% (Strict)</span>
                  </div>
                </div>

                {/* Limit slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8BA882]">Daily Limit</label>
                    <span className="text-xs font-extrabold text-[#B8F023]">{prefs.daily_limit} apps</span>
                  </div>
                  <input 
                    id="onboard-limit-slider" 
                    type="range" 
                    min="1" 
                    max="20"
                    value={prefs.daily_limit}
                    onChange={(e) => setPrefs((p) => ({ ...p, daily_limit: Number(e.target.value) }))}
                    className="w-full h-1" 
                  />
                  <div className="flex justify-between text-[9px] text-[#556B52] font-semibold">
                    <span>1 job/day</span>
                    <span>10 jobs/day</span>
                    <span>20 jobs/day</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[rgba(184,240,35,0.08)]">
              <button onClick={() => setStep(2)} className="btn-secondary text-xs gap-1 py-2.5 px-4 w-auto rounded-full">
                <i className="ti ti-arrow-left"></i>
              </button>
              <button id="onboard-step3-next" onClick={() => setStep(4)} className="btn-primary flex-1 text-xs py-2.5 gap-1.5 justify-center">
                Continue <i className="ti ti-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Finished */}
        {step === 4 && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                <i className="ti ti-circle-check text-3xl text-[#4ADE80]"></i>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F0F5E8] tracking-tight">Profile ready!</h2>
                <p className="text-[#8BA882] text-xs mt-1">Configure complete. Start matching live jobs.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                {[
                  ['Roles Map', prefs.target_roles.slice(0, 1).join('') || 'Anywhere'],
                  ['Locations', prefs.target_locations.slice(0, 1).join('') || 'Remote'],
                  ['Auto-Apply', prefs.auto_apply_enabled ? '✅ On' : '❌ Off'],
                  ['Daily Limit', `${prefs.daily_limit} jobs`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#1C2B1C] border border-[rgba(184,240,35,0.08)] rounded-xl p-3">
                    <p className="text-[#556B52] text-[9px] uppercase font-bold tracking-wider mb-0.5">{k}</p>
                    <p className="text-[#F0F5E8] font-bold truncate">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              id="onboard-finish-btn" 
              onClick={finishOnboarding} 
              className="btn-primary w-full py-3.5 gap-2 font-bold justify-center"
            >
              Enter Dashboard <i className="ti ti-arrow-right"></i>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
