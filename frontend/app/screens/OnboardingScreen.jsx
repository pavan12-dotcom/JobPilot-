'use client';
import { useState } from 'react';
import { resumeApi, preferencesApi } from '@/lib/api';

const STEPS = ['Resume', 'Preferences', 'Auto-Apply', 'Ready'];

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'];

export default function OnboardingScreen({ goTo, showToast }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [prefs, setPrefs] = useState({
    target_roles: ['Product Designer', 'UX Designer'],
    target_locations: ['Remote', 'Hyderabad'],
    preferred_job_types: ['FULL_TIME', 'REMOTE'],
    min_match_score: 70,
    daily_limit: 10,
    auto_apply_enabled: true,
  });

  function addTag(field, val, reset) {
    const trimmed = val.trim();
    if (!trimmed) return;
    setPrefs((p) => ({ ...p, [field]: [...new Set([...p[field], trimmed])] }));
    reset('');
  }
  function removeTag(field, val) {
    setPrefs((p) => ({ ...p, [field]: p[field].filter((x) => x !== val) }));
  }
  function toggleJobType(t) {
    setPrefs((p) => ({
      ...p,
      preferred_job_types: p.preferred_job_types.includes(t)
        ? p.preferred_job_types.filter((x) => x !== t)
        : [...p.preferred_job_types, t],
    }));
  }

  async function uploadResume() {
    if (!resumeFile) return;
    setUploading(true);
    try {
      await resumeApi.upload(resumeFile, 'My Resume');
      setResumeUploaded(true);
      showToast('Resume uploaded & parsed by Claude AI!');
      setStep(2);
    } catch {
      showToast('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function finishOnboarding() {
    setSaving(true);
    try {
      await preferencesApi.update(prefs);
      localStorage.setItem('applyai_onboarded', '1');
      showToast('Profile ready! Fetching matched jobs…');
      goTo('home');
    } catch {
      localStorage.setItem('applyai_onboarded', '1');
      goTo('home');
    } finally {
      setSaving(false);
    }
  }

  const Tag = ({ label, onRemove }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--lime-dim)', color: 'var(--lime)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
      {label}
      <i className="ti ti-x" style={{ fontSize: 9, cursor: 'pointer' }} onClick={onRemove} />
    </span>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ height: 3, width: '100%', background: i < step ? 'var(--lime)' : 'var(--bg3)', borderRadius: 2, transition: 'background 0.3s' }} />
              <span style={{ fontSize: 9, color: i < step ? 'var(--lime)' : 'var(--text3)', fontWeight: 600 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 20px 24px', display: 'flex', flexDirection: 'column' }}>

        {/* Step 1: Resume Upload */}
        {step === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Upload your resume</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Claude AI extracts your skills, experience & preferred roles</div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--bg2)', border: `2px dashed ${resumeFile ? 'var(--lime)' : 'var(--border2)'}`, borderRadius: 'var(--radius-lg)', padding: '28px 20px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <i className={`ti ${resumeFile ? 'ti-file-check' : 'ti-file-upload'}`} style={{ fontSize: 36, color: resumeFile ? 'var(--lime)' : 'var(--text3)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: resumeFile ? 'var(--lime)' : 'var(--text1)' }}>{resumeFile ? resumeFile.name : 'Tap to choose PDF'}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>PDF, DOC, DOCX — max 10 MB</div>
              </div>
              <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => setResumeFile(e.target.files[0])} />
            </label>

            {resumeFile && (
              <button
                onClick={uploadResume}
                disabled={uploading}
                style={{ width: '100%', background: uploading ? 'var(--bg3)' : 'var(--lime)', color: 'var(--bg)', border: 'none', padding: 14, borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 800, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {uploading ? (
                  <><span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--bg)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Uploading & parsing…</>
                ) : (
                  <>Upload & Continue <i className="ti ti-arrow-right" style={{ fontSize: 12 }} /></>
                )}
              </button>
            )}
            <button onClick={() => { localStorage.setItem('applyai_onboarded', '1'); setStep(2); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', marginTop: 4 }}>
              Skip for now →
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Step 2: Job Preferences */}
        {step === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Job preferences</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Set target roles, locations & job types</div>
            </div>

            {/* Target roles */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Target roles</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {prefs.target_roles.map((r) => <Tag key={r} label={r} onRemove={() => removeTag('target_roles', r)} />)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag('target_roles', roleInput, setRoleInput)}
                  placeholder="e.g. UX Designer"
                  style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                />
                <button onClick={() => addTag('target_roles', roleInput, setRoleInput)} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 36, height: 36, cursor: 'pointer', color: 'var(--lime)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-plus" />
                </button>
              </div>
            </div>

            {/* Locations */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Locations</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {prefs.target_locations.map((l) => <Tag key={l} label={l} onRemove={() => removeTag('target_locations', l)} />)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag('target_locations', locationInput, setLocationInput)}
                  placeholder="e.g. Remote, Hyderabad"
                  style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                />
                <button onClick={() => addTag('target_locations', locationInput, setLocationInput)} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 36, height: 36, cursor: 'pointer', color: 'var(--lime)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-plus" />
                </button>
              </div>
            </div>

            {/* Job types */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Job types</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {JOB_TYPES.map((t) => {
                  const key = t.replace('-', '_').toUpperCase();
                  const active = prefs.preferred_job_types.includes(key);
                  return (
                    <button key={t} onClick={() => toggleJobType(key)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit', background: active ? 'var(--lime)' : 'var(--bg2)', color: active ? 'var(--bg)' : 'var(--text2)', borderColor: active ? 'var(--lime)' : 'var(--border)', transition: 'all 0.2s' }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setStep(1)} style={{ background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '11px 16px', color: 'var(--text1)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                <i className="ti ti-arrow-left" />
              </button>
              <button onClick={() => setStep(3)} style={{ flex: 1, background: 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '12px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continue <i className="ti ti-arrow-right" style={{ fontSize: 11 }} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Auto-apply settings */}
        {step === 3 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Auto-Apply setup</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Configure automation controls</div>
            </div>

            {/* Auto-apply toggle */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Activate Automation Queue</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Applies to jobs matching your filters</div>
              </div>
              <button
                onClick={() => setPrefs((p) => ({ ...p, auto_apply_enabled: !p.auto_apply_enabled }))}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: prefs.auto_apply_enabled ? 'var(--lime)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', width: 16, height: 16, background: prefs.auto_apply_enabled ? 'var(--bg)' : 'var(--text3)', borderRadius: '50%', top: 4, left: prefs.auto_apply_enabled ? 24 : 4, transition: 'left 0.2s' }} />
              </button>
            </div>

            {/* Match score */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Match Score</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>{prefs.min_match_score}%</div>
              </div>
              <input type="range" min={60} max={95} step={5} value={prefs.min_match_score} onChange={(e) => setPrefs((p) => ({ ...p, min_match_score: +e.target.value }))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text3)', marginTop: 4, fontWeight: 600 }}>
                <span>60% Lax</span><span>75% Medium</span><span>95% Strict</span>
              </div>
            </div>

            {/* Daily limit */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Limit</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>{prefs.daily_limit} apps/day</div>
              </div>
              <input type="range" min={1} max={20} value={prefs.daily_limit} onChange={(e) => setPrefs((p) => ({ ...p, daily_limit: +e.target.value }))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text3)', marginTop: 4, fontWeight: 600 }}>
                <span>1/day</span><span>10/day</span><span>20/day</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setStep(2)} style={{ background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '11px 16px', color: 'var(--text1)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                <i className="ti ti-arrow-left" />
              </button>
              <button onClick={() => setStep(4)} style={{ flex: 1, background: 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '12px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continue <i className="ti ti-arrow-right" style={{ fontSize: 11 }} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: All done */}
        {step === 4 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center', paddingTop: 16 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 20, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-circle-check" style={{ fontSize: 30, color: '#4ADE80' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text1)', marginBottom: 6 }}>Profile ready!</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Configuration complete. Matching live jobs now…</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Target Role', prefs.target_roles[0] || '—'],
                ['Location', prefs.target_locations[0] || 'Remote'],
                ['Auto-Apply', prefs.auto_apply_enabled ? '✅ On' : '❌ Off'],
                ['Daily Limit', `${prefs.daily_limit} jobs`],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{v}</div>
                </div>
              ))}
            </div>

            <button
              onClick={finishOnboarding}
              disabled={saving}
              style={{ width: '100%', background: saving ? 'var(--bg3)' : 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '14px', borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {saving ? 'Saving…' : <>Enter Dashboard <i className="ti ti-arrow-right" style={{ fontSize: 12 }} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
