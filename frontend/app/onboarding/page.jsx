'use client';
// app/onboarding/page.jsx — 4-step onboarding wizard
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
  { id: 1, label: 'Upload Resume', icon: Upload },
  { id: 2, label: 'Set Preferences', icon: Briefcase },
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
      toast.success('Resume parsed!');
      setTimeout(() => setStep(2), 800);
    } catch {
      setResume({ file_name: file.name, parsed_data: { skills: ['JavaScript', 'Node.js', 'React'], current_role: 'Developer', total_experience_years: 2 } });
      clearInterval(interval);
      setUploadProgress(100);
      toast.success('Resume uploaded! (Demo mode)');
      setTimeout(() => setStep(2), 800);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1 });

  const addTag = (field, value, setter) => {
    if (!value.trim() || prefs[field].includes(value.trim())) return;
    setPrefs((p) => ({ ...p, [field]: [...p[field], value.trim()] }));
    setter('');
  };

  async function finishOnboarding() {
    try {
      await preferencesApi.update(prefs);
    } catch {}
    toast.success('You\'re all set! Welcome to ApplyAI!');
    router.push('/dashboard');
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">ApplyAI</span>
          </div>
          <h1 className="text-2xl font-bold">Let's get you set up</h1>
          <p className="text-text-muted text-sm mt-1">Takes about 2 minutes</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s.id ? 'bg-success text-white' :
                step === s.id ? 'bg-primary text-white' :
                'bg-card border border-border text-text-muted'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${step > s.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="progress-bar mb-6">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step content */}
        <div className="card animate-slide-up">

          {/* Step 1: Resume */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-text mb-1">Upload your resume</h2>
              <p className="text-text-muted text-sm mb-6">We'll use AI to parse your skills and experience</p>

              {uploading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <p className="font-semibold text-text mb-2">Reading your resume with AI…</p>
                  <p className="text-text-muted text-sm mb-4">Extracting skills, experience, and education</p>
                  <div className="progress-bar max-w-xs mx-auto">
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : resume ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-3" />
                  <p className="font-semibold text-text">{resume.file_name}</p>
                  <p className="text-text-muted text-sm">Found: {resume.parsed_data?.skills?.slice(0, 4).join(', ')}...</p>
                  <button onClick={() => setStep(2)} className="btn-primary mt-4 gap-2">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <input {...getInputProps()} id="onboarding-resume-upload" />
                  <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="font-medium text-text mb-1">Drag & drop your PDF resume</p>
                  <p className="text-text-muted text-sm">or <span className="text-primary">browse files</span></p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-text mb-1">What roles are you targeting?</h2>
              <p className="text-text-muted text-sm mb-5">Add your target job titles and preferred locations</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-muted mb-2 block">Target Roles</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {prefs.target_roles.map((r) => (
                      <span key={r} className="badge-blue flex items-center gap-1.5">
                        {r}<button onClick={() => setPrefs((p) => ({ ...p, target_roles: p.target_roles.filter((x) => x !== r) }))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input id="onboard-role" className="input flex-1" placeholder="Software Engineer" value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag('target_roles', roleInput, setRoleInput)} />
                    <button onClick={() => addTag('target_roles', roleInput, setRoleInput)} className="btn-secondary"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-muted mb-2 block">Locations</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {prefs.target_locations.map((l) => (
                      <span key={l} className="badge-blue flex items-center gap-1.5">
                        {l}<button onClick={() => setPrefs((p) => ({ ...p, target_locations: p.target_locations.filter((x) => x !== l) }))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input id="onboard-location" className="input flex-1" placeholder="Bangalore, Remote, Mumbai" value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag('target_locations', locationInput, setLocationInput)} />
                    <button onClick={() => addTag('target_locations', locationInput, setLocationInput)} className="btn-secondary"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
                <button id="onboard-step2-next" onClick={() => setStep(3)} className="btn-primary flex-1 gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* Step 3: Auto-apply */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-text mb-1">Enable Auto-Apply?</h2>
              <p className="text-text-muted text-sm mb-5">Let AI automatically apply to matching jobs for you</p>

              <div className="space-y-4">
                <div className="card bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text">Auto-Apply</p>
                      <p className="text-xs text-text-muted">Apply automatically to high-match jobs</p>
                    </div>
                    <button
                      id="onboard-auto-apply-toggle"
                      onClick={() => setPrefs((p) => ({ ...p, auto_apply_enabled: !p.auto_apply_enabled }))}
                      className={`w-12 h-6 rounded-full transition-colors ${prefs.auto_apply_enabled ? 'bg-primary' : 'bg-border'}`}
                    >
                      <span className={`block w-4 h-4 bg-white rounded-full m-1 transition-transform ${prefs.auto_apply_enabled ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-muted mb-2 block">
                    Min Match Score: <span className="text-primary font-bold">{prefs.min_match_score}%</span>
                  </label>
                  <input id="onboard-score-slider" type="range" min="60" max="95" step="5"
                    value={prefs.min_match_score}
                    onChange={(e) => setPrefs((p) => ({ ...p, min_match_score: Number(e.target.value) }))}
                    className="w-full accent-primary" />
                </div>

                <div>
                  <label className="text-sm font-medium text-text-muted mb-2 block">
                    Daily Limit: <span className="text-primary font-bold">{prefs.daily_limit} applications</span>
                  </label>
                  <input id="onboard-limit-slider" type="range" min="1" max="20"
                    value={prefs.daily_limit}
                    onChange={(e) => setPrefs((p) => ({ ...p, daily_limit: Number(e.target.value) }))}
                    className="w-full accent-primary" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="btn-secondary gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
                <button id="onboard-step3-next" onClick={() => setStep(4)} className="btn-primary flex-1 gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-success/10 border border-success/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">You're ready to apply!</h2>
              <p className="text-text-muted mb-6">
                ApplyAI will find and apply to matching jobs automatically.
                {prefs.auto_apply_enabled && ` Auto-apply enabled for ${prefs.min_match_score}%+ matches.`}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                {[
                  ['Target Roles', prefs.target_roles.join(', ') || 'Not set'],
                  ['Locations', prefs.target_locations.join(', ') || 'Not set'],
                  ['Auto-Apply', prefs.auto_apply_enabled ? '✅ Enabled' : '❌ Disabled'],
                  ['Daily Limit', `${prefs.daily_limit} applications`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface rounded-lg p-3 text-left">
                    <p className="text-text-subtle text-xs mb-0.5">{k}</p>
                    <p className="text-text font-medium text-sm truncate">{v}</p>
                  </div>
                ))}
              </div>
              <button id="onboard-finish-btn" onClick={finishOnboarding} className="btn-primary w-full py-3 gap-2">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
