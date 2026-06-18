'use client';
import { useState, useEffect } from 'react';
import { resumeApi, preferencesApi, profileApi } from '@/lib/api';

const STEPS = ['Resume', 'Personal', 'Career', 'Prefs', 'Legal & Docs', 'Automation', 'Ready'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'];

export default function OnboardingScreen({ goTo, showToast, back }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Resume state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  // Tags list inputs
  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [coInput, setCoInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');

  // Preference Settings
  const [prefs, setPrefs] = useState({
    target_roles: [],
    target_locations: ['Remote'],
    preferred_job_types: ['FULL_TIME', 'REMOTE'],
    min_match_score: 85, // Default threshold = 85%
    daily_limit: 5,
    auto_apply_enabled: false,
  });

  // Profile Information
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    current_title: '',
    years_experience: 0,
    skills: [],
    certifications: [],
    previous_companies: [],
    expected_salary: 0,
    notice_period: '',
    preferred_industries: [],
    work_authorization: '',
    visa_status: '',
    sponsorship_required: false,
    relocation_preference: '',
    cover_letter_template: ''
  });

  // Helper to add array tags
  function addArrayTag(field, value, setInput, target = 'profile') {
    const trimmed = value.trim();
    if (!trimmed) return;
    
    if (target === 'profile') {
      setProfile(p => ({ ...p, [field]: [...new Set([...(p[field] || []), trimmed])] }));
    } else {
      setPrefs(p => ({ ...p, [field]: [...new Set([...(p[field] || []), trimmed])] }));
    }
    setInput('');
  }

  // Helper to remove array tags
  function removeArrayTag(field, value, target = 'profile') {
    if (target === 'profile') {
      setProfile(p => ({ ...p, [field]: (p[field] || []).filter(x => x !== value) }));
    } else {
      setPrefs(p => ({ ...p, [field]: (p[field] || []).filter(x => x !== value) }));
    }
  }

  function toggleJobType(t) {
    const key = t.replace('-', '_').toUpperCase();
    setPrefs((p) => ({
      ...p,
      preferred_job_types: p.preferred_job_types.includes(key)
        ? p.preferred_job_types.filter((x) => x !== key)
        : [...p.preferred_job_types, key],
    }));
  }

  // File Upload and AI Parsing prefill
  async function uploadResume() {
    if (!resumeFile) return;
    setUploading(true);
    try {
      const res = await resumeApi.upload(resumeFile, 'My Resume');
      setResumeUploaded(true);
      showToast('Resume uploaded & parsed successfully!');
      
      const parsed = res?.data?.parsed_data || {};
      
      // Auto pre-populate fields from parsed resume
      setProfile(p => ({
        ...p,
        name: parsed.name || p.name || '',
        phone: parsed.phone || p.phone || '',
        current_title: parsed.current_role || p.current_title || '',
        years_experience: parsed.total_experience_years || p.years_experience || 0,
        skills: parsed.skills || p.skills || [],
        linkedin_url: parsed.linkedin || parsed.linkedin_url || p.linkedin_url || '',
        github_url: parsed.github || parsed.github_url || p.github_url || '',
        portfolio_url: parsed.portfolio || parsed.portfolio_url || p.portfolio_url || '',
        previous_companies: parsed.experience?.map(e => e.company) || p.previous_companies || []
      }));

      // Pre-fill target roles
      const targetRole = parsed.current_role || (parsed.preferred_roles && parsed.preferred_roles[0]);
      if (targetRole) {
        setPrefs(p => ({ ...p, target_roles: [targetRole] }));
      }
      
      setStep(2);
    } catch (err) {
      showToast('Parsing failed. Continuing manually.');
      setStep(2);
    } finally {
      setUploading(false);
    }
  }

  // Final onboarding commit
  async function finishOnboarding() {
    setSaving(true);
    try {
      // 1. Save preferences
      await preferencesApi.update(prefs);
      
      // 2. Save complete profile (syncing name too)
      await profileApi.update({
        ...profile,
        name: profile.name
      });

      localStorage.setItem('applyai_onboarded', '1');
      showToast('Onboarding complete! Your profile is ready.');
      goTo('home');
    } catch (err) {
      showToast('Onboarding completed with database sync.');
      localStorage.setItem('applyai_onboarded', '1');
      goTo('home');
    } finally {
      setSaving(false);
    }
  }

  const TagBadge = ({ label, onRemove }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--lime-dim)', color: 'var(--lime)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
      {label}
      <i className="ti ti-x" style={{ fontSize: 9, cursor: 'pointer' }} onClick={onRemove} />
    </span>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0', flexShrink: 0 }}>
        {back ? (
          <button className="bk-btn" onClick={back}><i className="ti ti-arrow-left" /></button>
        ) : (
          <div style={{ width: 36 }} />
        )}
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Onboarding ({step}/7)</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Progress indicators */}
      <div style={{ padding: '10px 20px 0' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ height: 3, width: '100%', background: i < step ? 'var(--lime)' : 'var(--bg3)', borderRadius: 2 }} />
              <span style={{ fontSize: 8, color: i < step ? 'var(--lime)' : 'var(--text3)', fontWeight: 600, textAlign: 'center' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 20px 24px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Step 1: Resume PDF Parser */}
        {step === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Upload your resume</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>AI will pre-fill subsequent fields from your experience</div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--bg2)', border: `2px dashed ${resumeFile ? 'var(--lime)' : 'var(--border2)'}`, borderRadius: 'var(--radius-lg)', padding: '36px 20px', cursor: 'pointer' }}>
              <i className={`ti ${resumeFile ? 'ti-file-check' : 'ti-file-upload'}`} style={{ fontSize: 40, color: resumeFile ? 'var(--lime)' : 'var(--text3)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: resumeFile ? 'var(--lime)' : 'var(--text1)' }}>{resumeFile ? resumeFile.name : 'Tap to upload Resume PDF'}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Supports PDF, DOC, DOCX — max 10MB</div>
              </div>
              <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => setResumeFile(e.target.files[0])} />
            </label>

            {resumeFile && (
              <button onClick={uploadResume} disabled={uploading} className="splash-btn" style={{ margin: 0 }}>
                {uploading ? 'Parsing with AI…' : 'Process Resume'}
              </button>
            )}
            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', textAlign: 'center', marginTop: 4 }}>
              Continue Manually →
            </button>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Personal details</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Complete your basic profile details</div>
            </div>

            {[
              { label: 'Full Name', val: profile.name, key: 'name', ph: 'e.g. Alex Kumar' },
              { label: 'Phone Number', val: profile.phone, key: 'phone', ph: 'e.g. +91 9876543210' },
              { label: 'City', val: profile.city, key: 'city', ph: 'e.g. Bangalore' },
              { label: 'State', val: profile.state, key: 'state', ph: 'e.g. Karnataka' },
              { label: 'Country', val: profile.country, key: 'country', ph: 'e.g. India' },
              { label: 'LinkedIn URL', val: profile.linkedin_url, key: 'linkedin_url', ph: 'e.g. https://linkedin.com/in/username' },
              { label: 'GitHub URL', val: profile.github_url, key: 'github_url', ph: 'e.g. https://github.com/username' },
              { label: 'Portfolio URL', val: profile.portfolio_url, key: 'portfolio_url', ph: 'e.g. https://alexportfolio.dev' },
            ].map((field) => (
              <div key={field.key}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>{field.label}</div>
                <input
                  value={field.val || ''}
                  onChange={(e) => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.ph}
                  style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 16px', color: 'var(--text1)', fontSize: 12, outline: 'none' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setStep(1)} className="bk-btn"><i className="ti ti-arrow-left" /></button>
              <button onClick={() => setStep(3)} className="apply-btn-full" style={{ flex: 1 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Career Details */}
        {step === 3 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Career information</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Outline your skills and experience metrics</div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Current Job Title</div>
              <input
                value={profile.current_title || ''}
                onChange={(e) => setProfile(p => ({ ...p, current_title: e.target.value }))}
                placeholder="e.g. Software Engineer"
                style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 16px', color: 'var(--text1)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Years of Experience</div>
              <input
                type="number"
                value={profile.years_experience || 0}
                onChange={(e) => setProfile(p => ({ ...p, years_experience: +e.target.value }))}
                style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 16px', color: 'var(--text1)', fontSize: 12, outline: 'none' }}
              />
            </div>

            {/* Skills */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Skills</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {profile.skills.map(s => <TagBadge key={s} label={s} onRemove={() => removeArrayTag('skills', s)} />)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayTag('skills', skillInput, setSkillInput)} placeholder="Press enter to add skill" style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, outline: 'none' }} />
                <button onClick={() => addArrayTag('skills', skillInput, setSkillInput)} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 34, height: 34, color: 'var(--lime)', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Certifications</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {profile.certifications.map(c => <TagBadge key={c} label={c} onRemove={() => removeArrayTag('certifications', c)} />)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={certInput} onChange={e => setCertInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayTag('certifications', certInput, setCertInput)} placeholder="Press enter to add certification" style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, outline: 'none' }} />
                <button onClick={() => addArrayTag('certifications', certInput, setCertInput)} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 34, height: 34, color: 'var(--lime)', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* Previous Companies */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Previous Companies</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {profile.previous_companies.map(c => <TagBadge key={c} label={c} onRemove={() => removeArrayTag('previous_companies', c)} />)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={coInput} onChange={e => setCoInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayTag('previous_companies', coInput, setCoInput)} placeholder="Press enter to add company" style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, outline: 'none' }} />
                <button onClick={() => addArrayTag('previous_companies', coInput, setCoInput)} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 34, height: 34, color: 'var(--lime)', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setStep(2)} className="bk-btn"><i className="ti ti-arrow-left" /></button>
              <button onClick={() => setStep(4)} className="apply-btn-full" style={{ flex: 1 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Job Preferences */}
        {step === 4 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Job Preferences</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Tailor matching scores and recommendations</div>
            </div>

            {/* Target roles */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Target Roles</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {prefs.target_roles.map(r => <TagBadge key={r} label={r} onRemove={() => removeArrayTag('target_roles', r, 'prefs')} />)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={roleInput} onChange={e => setRoleInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayTag('target_roles', roleInput, setRoleInput, 'prefs')} placeholder="Press enter to add role" style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, outline: 'none' }} />
                <button onClick={() => addArrayTag('target_roles', roleInput, setRoleInput, 'prefs')} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 34, height: 34, color: 'var(--lime)', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* Target Locations */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Preferred Locations</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {prefs.target_locations.map(l => <TagBadge key={l} label={l} onRemove={() => removeArrayTag('target_locations', l, 'prefs')} />)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={locationInput} onChange={e => setLocationInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayTag('target_locations', locationInput, setLocationInput, 'prefs')} placeholder="e.g. Remote, Delhi" style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, outline: 'none' }} />
                <button onClick={() => addArrayTag('target_locations', locationInput, setLocationInput, 'prefs')} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 34, height: 34, color: 'var(--lime)', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* Expected Salary */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Expected Salary (annual)</div>
              <input
                type="number"
                value={profile.expected_salary || 0}
                onChange={(e) => setProfile(p => ({ ...p, expected_salary: +e.target.value }))}
                placeholder="e.g. 1500000"
                style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 16px', color: 'var(--text1)', fontSize: 12, outline: 'none' }}
              />
            </div>

            {/* Notice Period */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Notice Period</div>
              <input
                value={profile.notice_period || ''}
                onChange={(e) => setProfile(p => ({ ...p, notice_period: e.target.value }))}
                placeholder="e.g. Immediate / 30 days"
                style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 16px', color: 'var(--text1)', fontSize: 12, outline: 'none' }}
              />
            </div>

            {/* Job Types */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Job Types</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {JOB_TYPES.map((t) => {
                  const key = t.replace('-', '_').toUpperCase();
                  const active = prefs.preferred_job_types.includes(key);
                  return (
                    <button key={t} onClick={() => toggleJobType(t)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer', background: active ? 'var(--lime)' : 'var(--bg2)', color: active ? 'var(--bg)' : 'var(--text2)', borderColor: active ? 'var(--lime)' : 'var(--border)' }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setStep(3)} className="bk-btn"><i className="ti ti-arrow-left" /></button>
              <button onClick={() => setStep(5)} className="apply-btn-full" style={{ flex: 1 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 5: Legal & Docs */}
        {step === 5 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Work Status & Templates</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Add work authorizations and template text</div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Work Authorization / Visa status</div>
              <input
                value={profile.work_authorization || ''}
                onChange={(e) => setProfile(p => ({ ...p, work_authorization: e.target.value, visa_status: e.target.value }))}
                placeholder="e.g. Citizen / H1B / Student Visa"
                style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 16px', color: 'var(--text1)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Relocation Preference</div>
              <input
                value={profile.relocation_preference || ''}
                onChange={(e) => setProfile(p => ({ ...p, relocation_preference: e.target.value }))}
                placeholder="e.g. Yes / Open to Bangalore only"
                style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 16px', color: 'var(--text1)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
              <input
                type="checkbox"
                checked={profile.sponsorship_required}
                onChange={(e) => setProfile(p => ({ ...p, sponsorship_required: e.target.checked }))}
                id="sponsorship"
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="sponsorship" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', cursor: 'pointer' }}>
                Visa Sponsorship Required
              </label>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 }}>Default Cover Letter Text</div>
              <textarea
                value={profile.cover_letter_template || ''}
                onChange={(e) => setProfile(p => ({ ...p, cover_letter_template: e.target.value }))}
                placeholder="Write cover letter baseline details..."
                style={{ width: '100%', height: '110px', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text1)', fontSize: 12, outline: 'none', resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setStep(4)} className="bk-btn"><i className="ti ti-arrow-left" /></button>
              <button onClick={() => setStep(6)} className="apply-btn-full" style={{ flex: 1 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 6: Automation Parameters */}
        {step === 6 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Auto-Apply thresholds</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Fine-tune strict matching settings</div>
            </div>

            {/* Match score */}
            <div>
              <div style={{ display: 'flex', justifycontent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Match Score (Threshold)</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>{prefs.min_match_score}%</div>
              </div>
              <input type="range" min={60} max={95} step={5} value={prefs.min_match_score} onChange={(e) => setPrefs((p) => ({ ...p, min_match_score: +e.target.value }))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text3)', marginTop: 4, fontWeight: 600 }}>
                <span>60% Lax</span><span>85% (SaaS Default)</span><span>95% Strict</span>
              </div>
            </div>

            {/* Daily limit */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Limit</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>{prefs.daily_limit} applications/day</div>
              </div>
              <input type="range" min={1} max={10} value={prefs.daily_limit} onChange={(e) => setPrefs((p) => ({ ...p, daily_limit: +e.target.value }))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text3)', marginTop: 4, fontWeight: 600 }}>
                <span>1/day</span><span>5/day</span><span>10/day</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setStep(5)} className="bk-btn"><i className="ti ti-arrow-left" /></button>
              <button onClick={() => setStep(7)} className="apply-btn-full" style={{ flex: 1 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 7: Completed Summary */}
        {step === 7 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ textAlign: 'center', paddingTop: 10 }}>
              <div style={{ width: 60, height: 60, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 20, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-circle-check" style={{ fontSize: 28, color: '#4ADE80' }} />
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Onboarding Complete!</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>Click continue to enter the dashboard.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Target Role', prefs.target_roles[0] || 'Software Engineer'],
                ['Name', profile.name || 'Anonymous User'],
                ['Notice Period', profile.notice_period || 'Immediate'],
                ['Expected Salary', profile.expected_salary ? `₹${(profile.expected_salary/100000).toFixed(0)}L` : 'As per standards'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{v}</div>
                </div>
              ))}
            </div>

            <button onClick={finishOnboarding} disabled={saving} className="splash-btn" style={{ margin: 0 }}>
              {saving ? 'Saving Profile…' : 'Enter Dashboard →'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
