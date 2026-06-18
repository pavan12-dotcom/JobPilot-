'use client';
import { useState, useEffect, useRef } from 'react';
import { dashboardApi, resumeApi, preferencesApi, authApi } from '@/lib/api';

// ── iOS / standalone detection ───────────────────────────────────────────────
function detectIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function detectStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

// ── Install Banner component ─────────────────────────────────────────────────
function InstallBanner({ installApp, isInstallable }) {
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setIos(detectIOS());
    setStandalone(detectStandalone());
  }, []);

  if (standalone) {
    return (
      <div style={{ margin: '12px 20px 0', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="ti ti-device-mobile-check" style={{ fontSize: 22, color: '#4ADE80' }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4ADE80' }}>App Installed ✓</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>Running as a native app on your device</div>
        </div>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <div style={{ margin: '12px 20px 0', background: 'linear-gradient(135deg, var(--lime-dim) 0%, rgba(0, 229, 255, 0.05) 100%)', border: '1px solid var(--lime)', borderRadius: 'var(--radius-md)', padding: '14px 16px', boxShadow: '0 4px 20px rgba(0, 229, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-device-mobile" style={{ fontSize: 18, color: '#050A1A' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>Install JobPilot App</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>Works offline · No App Store needed</div>
            </div>
          </div>
          <button
            onClick={installApp}
            style={{ background: 'var(--lime)', color: '#050A1A', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
          >
            <i className="ti ti-download" style={{ fontSize: 13 }} /> Install
          </button>
        </div>
      </div>
    );
  }

  if (ios) {
    return (
      <div style={{ margin: '12px 20px 0', background: 'linear-gradient(135deg, var(--lime-dim) 0%, rgba(0, 229, 255, 0.04) 100%)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <button
          onClick={() => setShowGuide(!showGuide)}
          style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'inherit' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-brand-apple" style={{ fontSize: 18, color: '#050A1A' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>Add to Home Screen</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>Install on your iPhone / iPad</div>
            </div>
          </div>
          <i className={`ti ti-chevron-${showGuide ? 'up' : 'down'}`} style={{ fontSize: 16, color: 'var(--text3)', flexShrink: 0 }} />
        </button>

        {showGuide && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 1, icon: 'ti-share', text: 'Tap the Share button', sub: 'The box-with-arrow icon at the bottom of Safari' },
              { n: 2, icon: 'ti-square-rounded-plus', text: 'Tap "Add to Home Screen"', sub: 'Scroll down in the share sheet to find it' },
              { n: 3, icon: 'ti-check', text: 'Tap "Add"', sub: 'JobPilot appears on your home screen like a real native app' },
            ].map(({ n, icon, text, sub }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--lime)', color: '#050A1A', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 13, color: 'var(--lime)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{text}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
                </div>
              </div>
            ))}
            <div style={{ background: 'rgba(0, 229, 255, 0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
                <i className="ti ti-info-circle" style={{ fontSize: 12, color: 'var(--lime)', marginRight: 4 }} />
                Must use <strong style={{ color: 'var(--text1)' }}>Safari</strong> on iOS — Add to Home Screen only works in Safari.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ margin: '12px 20px 0', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className="ti ti-device-mobile" style={{ fontSize: 20, color: 'var(--lime)' }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Get the Mobile App</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>Open on your phone in Chrome (Android) or Safari (iOS) to install</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ goTo, user, showToast, setUser, back, installApp, isInstallable }) {
  const [stats, setStats] = useState(null);
  const [resume, setResume] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [subView, setSubView] = useState('main'); // 'main' | 'profile' | 'preferences' | 'privacy'

  // Profile Editor Form State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [dailyLimit, setDailyLimit] = useState(10);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);

  // Job Preferences Form State
  const [targetRoles, setTargetRoles] = useState([]);
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [targetLocations, setTargetLocations] = useState([]);
  const [targetLocationInput, setTargetLocationInput] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [preferredJobTypes, setPreferredJobTypes] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState('MID');
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(70);
  const [blacklistedCompanies, setBlacklistedCompanies] = useState([]);
  const [blacklistInput, setBlacklistInput] = useState('');

  // Privacy Mock Form State
  const [recruiterVisibility, setRecruiterVisibility] = useState(true);
  const [incognitoMode, setIncognitoMode] = useState(false);

  const name = user?.name || 'Arun Reddy';
  const email = user?.email || 'demo@jobpilot.dev';
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    const [statsRes, resumeRes, prefsRes] = await Promise.allSettled([
      dashboardApi.stats(),
      resumeApi.get(),
      preferencesApi.get(),
    ]);

    if (statsRes.status === 'fulfilled') setStats(statsRes.value?.data);

    let activeResume = null;
    if (resumeRes.status === 'fulfilled' && resumeRes.value?.data) {
      activeResume = resumeRes.value.data;
      setResume(activeResume);
    }

    let userPrefs = null;
    if (prefsRes.status === 'fulfilled' && prefsRes.value?.data) {
      userPrefs = prefsRes.value.data;
      setPrefs(userPrefs);
    }

    // Populate profile form state
    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
    setDailyLimit(user?.daily_apply_limit || 10);

    if (activeResume && activeResume.parsed_data) {
      const p = activeResume.parsed_data;
      setProfilePhone(p.phone || '');
      setLinkedinUrl(p.linkedin_url || p.linkedin || '');
      setGithubUrl(p.github_url || p.github || '');
      setPortfolioUrl(p.portfolio_url || p.portfolio || '');
      setCurrentLocation(p.current_location || p.location || '');
      setSkills(p.skills || []);
      setCurrentRole(p.current_role || '');
      setCoverLetter(p.cover_letter || '');
    }

    if (userPrefs) {
      setTargetRoles(userPrefs.target_roles || []);
      setTargetLocations(userPrefs.target_locations || []);
      setMinSalary(userPrefs.min_salary || '');
      setMaxSalary(userPrefs.max_salary || '');
      setPreferredJobTypes(userPrefs.job_types || []);
      setExperienceLevel(userPrefs.experience_level || 'MID');
      setAutoApplyEnabled(userPrefs.auto_apply_enabled || false);
      setMinMatchScore(userPrefs.min_match_score || 70);
      setBlacklistedCompanies(userPrefs.blacklisted_companies || []);
    }
  }

  function handleSignOut() {
    localStorage.removeItem('applyai_token');
    localStorage.removeItem('applyai_user');
    localStorage.removeItem('applyai_onboarded');
    setUser(null);
    goTo('splash');
  }

  // Resume helpers
  async function handleDeleteResume() {
    if (!resume) return;
    if (confirm('Are you sure you want to delete this resume?')) {
      try {
        await resumeApi.delete(resume.id);
        setResume(null);
        showToast('Resume deleted successfully');
        loadData();
      } catch (err) {
        showToast(err.message || 'Failed to delete resume');
      }
    }
  }

  async function handleReparseResume() {
    if (!resume) return;
    showToast('Reparsing resume with Gemini...');
    try {
      await resumeApi.reparse(resume.id);
      showToast('Resume reparsed successfully!');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to reparse resume');
    }
  }

  async function handleUploadResume(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingResume(true);
    showToast('Uploading & parsing resume...');
    try {
      await resumeApi.upload(file, file.name);
      showToast('New resume uploaded successfully!');
      loadData();
    } catch (err) {
      showToast(err.message || 'Upload failed');
    } finally {
      setUploadingResume(false);
    }
  }

  // Tag helper
  function addTag(state, setState, val, setInputVal) {
    const trimmed = val.trim();
    if (!trimmed) return;
    setState([...new Set([...state, trimmed])]);
    if (setInputVal) setInputVal('');
  }

  function removeTag(state, setState, val) {
    setState(state.filter((x) => x !== val));
  }

  function toggleJobType(t) {
    setPreferredJobTypes(
      preferredJobTypes.includes(t)
        ? preferredJobTypes.filter((x) => x !== t)
        : [...preferredJobTypes, t]
    );
  }

  // Form saving actions
  const [savingProfile, setSavingProfile] = useState(false);
  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      // 1. Update User Details (Name, Email, Daily Apply Limit)
      const uRes = await authApi.updateProfile({
        name: profileName,
        email: profileEmail,
        daily_apply_limit: Number(dailyLimit),
      });

      if (uRes.success) {
        setUser(uRes.data);
        localStorage.setItem('applyai_user', JSON.stringify(uRes.data));
      }

      // 2. Update Active Resume Fields (parsed_data)
      if (resume && resume.id) {
        await resumeApi.update(resume.id, {
          parsed_data: {
            name: profileName,
            email: profileEmail,
            phone: profilePhone,
            linkedin_url: linkedinUrl,
            github_url: githubUrl,
            portfolio_url: portfolioUrl,
            current_location: currentLocation,
            skills: skills,
            current_role: currentRole,
            cover_letter: coverLetter,
          }
        });
      }

      showToast('Profile updated successfully!');
      setSubView('main');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  const [savingPrefs, setSavingPrefs] = useState(false);
  async function handleSavePrefs() {
    setSavingPrefs(true);
    try {
      await preferencesApi.update({
        target_roles: targetRoles,
        target_locations: targetLocations,
        min_salary: minSalary ? Number(minSalary) : null,
        max_salary: maxSalary ? Number(maxSalary) : null,
        job_types: preferredJobTypes,
        experience_level: experienceLevel,
        auto_apply_enabled: autoApplyEnabled,
        min_match_score: Number(minMatchScore),
        blacklisted_companies: blacklistedCompanies,
      });

      showToast('Preferences updated successfully!');
      setSubView('main');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  }

  const s = stats || { total_applied: 0, interviews: 0, total_matched: 0 };
  const role = resume?.parsed_data?.current_role || user?.role || 'Not specified';
  const loc = prefs?.target_locations?.[0] || 'Not specified';
  const experience = resume?.parsed_data?.total_experience_years !== undefined
    ? `${resume.parsed_data.total_experience_years}yr`
    : '0yr';
  const profilePct = resume ? 95 : 30;

  const menuItems = [
    { icon: 'ti-user', label: 'My Profile', sub: 'Resume, skills, portfolio', badge: null, action: () => setSubView('profile') },
    { icon: 'ti-file-text', label: 'My Applications', sub: 'Track all applications', badge: s.total_applied !== undefined ? String(s.total_applied) : '0', action: () => goTo('saved') },
    { icon: 'ti-bell', label: 'Job Alerts', sub: 'Active job scan queue', badge: null, action: () => goTo('notifications') },
    { icon: 'ti-shield', label: 'Notification Settings', sub: 'Allow or manage alerts', badge: null, action: () => goTo('permissions') },
  ];
  const prefItems = [
    { icon: 'ti-adjustments', label: 'Job Preferences', sub: prefs?.target_roles?.[0] ? `${prefs.target_roles[0]}${prefs.target_roles.length > 1 ? `, +${prefs.target_roles.length - 1}` : ''}` : 'Role, salary, location', action: () => setSubView('preferences') },
    { icon: 'ti-lock', label: 'Privacy', sub: 'Who can see your profile', action: () => setSubView('privacy') },
    { icon: 'ti-help', label: 'Help & Support', sub: 'FAQs, contact us', action: () => showToast('Support: support@jobpilot.dev') },
  ];

  const Tag = ({ label, onRemove }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--lime-dim)', color: 'var(--lime)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
      {label}
      <i className="ti ti-x" style={{ fontSize: 9, cursor: 'pointer' }} onClick={onRemove} />
    </span>
  );

  // Sub-views Rendering logic
  if (subView === 'profile') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="bk-btn" onClick={() => setSubView('main')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18, color: 'var(--text1)' }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 850, color: 'var(--text1)', letterSpacing: -0.2 }}>Edit Profile</span>
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            style={{ background: 'var(--lime)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: savingProfile ? 'not-allowed' : 'pointer' }}
          >
            {savingProfile ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Full Name */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Full Name</div>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Arun Reddy"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          {/* Email */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Email</div>
            <input
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              placeholder="e.g. arun@example.com"
              type="email"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          {/* Phone Number */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Phone Number</div>
            <input
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              placeholder="e.g. +91 9999999999"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          {/* Current Location */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Current Location</div>
            <input
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              placeholder="e.g. Hyderabad, India"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          {/* Job Role */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Current Job Role</div>
            <input
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          {/* Social Links */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>LinkedIn URL</div>
            <input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }}
            />

            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>GitHub URL</div>
            <input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }}
            />

            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Portfolio URL</div>
            <input
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://portfolio.dev"
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          {/* Skills */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Skills</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {skills.map((sk) => <Tag key={sk} label={sk} onRemove={() => removeTag(skills, setSkills, sk)} />)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag(skills, setSkills, skillInput, setSkillInput)}
                placeholder="Type a skill (e.g. React) and press Enter"
                style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={() => addTag(skills, setSkills, skillInput, setSkillInput)} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 36, height: 36, cursor: 'pointer', color: 'var(--lime)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-plus" />
              </button>
            </div>
          </div>

          {/* Daily limit */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Limit</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>{dailyLimit} apps/day</div>
            </div>
            <input type="range" min={1} max={25} value={dailyLimit} onChange={(e) => setDailyLimit(+e.target.value)} style={{ width: '100%' }} />
          </div>

          {/* Cover Letter */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Cover Letter Instructions / Prompt</div>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Provide specific notes or instructions to customize the AI cover letter. Example: 'Focus on my 3 years of Kubernetes experience and highlight my AWS certification.'"
              style={{ width: '100%', height: 100, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Resume Upload section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Active Resume File</div>
            {resume ? (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <i className="ti ti-file-text" style={{ fontSize: 28, color: 'var(--lime)' }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{resume.file_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Uploaded on {new Date(resume.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleReparseResume} style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text1)', borderRadius: 'var(--radius-full)', padding: '8px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <i className="ti ti-refresh" /> Reparse (AI)
                  </button>
                  <button onClick={handleDeleteResume} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', borderRadius: 'var(--radius-full)', padding: '8px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ti ti-trash" /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '2px dashed var(--border2)', borderRadius: 'var(--radius-lg)', padding: '24px', cursor: 'pointer', textAlign: 'center' }}
              >
                <i className="ti ti-upload" style={{ fontSize: 30, color: 'var(--text3)' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Upload Resume PDF</div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>Must be PDF format (max 10MB)</div>
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} accept=".pdf" style={{ display: 'none' }} onChange={handleUploadResume} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 10 }}>
            <button onClick={() => setSubView('main')} style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', color: 'var(--text2)', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSaveProfile} disabled={savingProfile} style={{ flex: 1.5, background: 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 800, cursor: savingProfile ? 'not-allowed' : 'pointer' }}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'preferences') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="bk-btn" onClick={() => setSubView('main')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18, color: 'var(--text1)' }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 850, color: 'var(--text1)', letterSpacing: -0.2 }}>Preferences</span>
          <button
            onClick={handleSavePrefs}
            disabled={savingPrefs}
            style={{ background: 'var(--lime)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: savingPrefs ? 'not-allowed' : 'pointer' }}
          >
            {savingPrefs ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Auto-apply toggle */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Auto-Apply Enabled</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Allow systems to submit applications automatically</div>
            </div>
            <button
              onClick={() => setAutoApplyEnabled(!autoApplyEnabled)}
              style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: autoApplyEnabled ? 'var(--lime)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <span style={{ position: 'absolute', width: 16, height: 16, background: autoApplyEnabled ? 'var(--bg)' : 'var(--text3)', borderRadius: '50%', top: 4, left: autoApplyEnabled ? 24 : 4, transition: 'left 0.2s' }} />
            </button>
          </div>

          {/* Target Roles */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Target Roles</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {targetRoles.map((r) => <Tag key={r} label={r} onRemove={() => removeTag(targetRoles, setTargetRoles, r)} />)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag(targetRoles, setTargetRoles, targetRoleInput, setTargetRoleInput)}
                placeholder="e.g. Frontend Developer"
                style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={() => addTag(targetRoles, setTargetRoles, targetRoleInput, setTargetRoleInput)} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 36, height: 36, cursor: 'pointer', color: 'var(--lime)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-plus" />
              </button>
            </div>
          </div>

          {/* Preferred Locations */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Preferred Locations</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {targetLocations.map((l) => <Tag key={l} label={l} onRemove={() => removeTag(targetLocations, setTargetLocations, l)} />)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={targetLocationInput}
                onChange={(e) => setTargetLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag(targetLocations, setTargetLocations, targetLocationInput, setTargetLocationInput)}
                placeholder="e.g. Remote, Bangalore"
                style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={() => addTag(targetLocations, setTargetLocations, targetLocationInput, setTargetLocationInput)} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 36, height: 36, cursor: 'pointer', color: 'var(--lime)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-plus" />
              </button>
            </div>
          </div>

          {/* Salary limits */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Min Salary (INR / yr)</div>
              <input
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="e.g. 800000"
                type="number"
                style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Max Salary (INR / yr)</div>
              <input
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                placeholder="e.g. 1500000"
                type="number"
                style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          </div>

          {/* Job Types */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Job Types</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'].map((t) => {
                const key = t.replace('-', '_').toUpperCase();
                const active = preferredJobTypes.includes(key);
                return (
                  <button key={t} onClick={() => toggleJobType(key)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit', background: active ? 'var(--lime)' : 'var(--bg2)', color: active ? 'var(--bg)' : 'var(--text2)', borderColor: active ? 'var(--lime)' : 'var(--border)', transition: 'all 0.2s' }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience level select */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Experience Level</div>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
            >
              <option value="ENTRY">Entry Level</option>
              <option value="MID">Mid Level</option>
              <option value="SENIOR">Senior Level</option>
              <option value="LEAD">Team Lead</option>
              <option value="EXECUTIVE">Executive / Director</option>
            </select>
          </div>

          {/* Min Match Score */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Match Score</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>{minMatchScore}%</div>
            </div>
            <input type="range" min={50} max={95} step={5} value={minMatchScore} onChange={(e) => setMinMatchScore(+e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text3)', marginTop: 4, fontWeight: 600 }}>
              <span>50% Low</span><span>75% Med</span><span>95% High</span>
            </div>
          </div>

          {/* Blacklisted companies */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Blacklisted Companies (will not apply)</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {blacklistedCompanies.map((c) => <Tag key={c} label={c} onRemove={() => removeTag(blacklistedCompanies, setBlacklistedCompanies, c)} />)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={blacklistInput}
                onChange={(e) => setBlacklistInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag(blacklistedCompanies, setBlacklistedCompanies, blacklistInput, setBlacklistInput)}
                placeholder="e.g. Competitor Corp"
                style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={() => addTag(blacklistedCompanies, setBlacklistedCompanies, blacklistInput, setBlacklistInput)} style={{ background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', width: 36, height: 36, cursor: 'pointer', color: 'var(--lime)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-plus" />
              </button>
            </div>
          </div>

          {/* Save buttons */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 10 }}>
            <button onClick={() => setSubView('main')} style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', color: 'var(--text2)', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSavePrefs} disabled={savingPrefs} style={{ flex: 1.5, background: 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 800, cursor: savingPrefs ? 'not-allowed' : 'pointer' }}>
              {savingPrefs ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'privacy') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="bk-btn" onClick={() => setSubView('main')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18, color: 'var(--text1)' }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 850, color: 'var(--text1)', letterSpacing: -0.2 }}>Privacy Settings</span>
          <button
            onClick={() => { showToast('Privacy settings saved!'); setSubView('main'); }}
            style={{ background: 'var(--lime)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            Save
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Recruiter Visibility */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Profile Visibility</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, lineHeight: 1.4 }}>Allow verified recruiters to find your resume profile</div>
            </div>
            <button
              onClick={() => setRecruiterVisibility(!recruiterVisibility)}
              style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: recruiterVisibility ? 'var(--lime)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <span style={{ position: 'absolute', width: 16, height: 16, background: recruiterVisibility ? 'var(--bg)' : 'var(--text3)', borderRadius: '50%', top: 4, left: recruiterVisibility ? 24 : 4, transition: 'left 0.2s' }} />
            </button>
          </div>

          {/* Incognito Mode */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Incognito Apply Mode</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, lineHeight: 1.4 }}>Mask real email with a proxy address on generic apply forms</div>
            </div>
            <button
              onClick={() => setIncognitoMode(!incognitoMode)}
              style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: incognitoMode ? 'var(--lime)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <span style={{ position: 'absolute', width: 16, height: 16, background: incognitoMode ? 'var(--bg)' : 'var(--text3)', borderRadius: '50%', top: 4, left: incognitoMode ? 24 : 4, transition: 'left 0.2s' }} />
            </button>
          </div>

          <div style={{ background: 'rgba(0, 229, 255, 0.04)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', padding: 14, fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
            <i className="ti ti-info-circle" style={{ color: 'var(--lime)', marginRight: 6 }} />
            Privacy settings apply automatically across all browser agents executing applications. Masking your email might delay some notifications from employers who do not parse redirect logs correctly.
          </div>

          {/* Save & cancel */}
          <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20 }}>
            <button onClick={() => setSubView('main')} style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', color: 'var(--text2)', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => { showToast('Privacy settings saved!'); setSubView('main'); }} style={{ flex: 1.5, background: 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Save Settings</button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT MAIN VIEW
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Hero section */}
      <div className="prof-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 }}>
          {back ? (
            <button className="bk-btn" onClick={back} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 18, color: 'var(--text1)' }} />
            </button>
          ) : (
            <div style={{ width: 36 }} />
          )}
          <div className="ibtn" onClick={() => setSubView('profile')}><i className="ti ti-settings" /></div>
        </div>
        <div className="prof-ava">{initials}</div>
        <div className="prof-name">{name}</div>
        <div className="prof-role">{role}</div>
        <div className="prof-loc"><i className="ti ti-map-pin" />{loc}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{email}</div>

        <div className="prof-stats">
          {[
            { v: s.total_applied ?? 0, l: 'Applied' },
            { v: s.interviews ?? 0, l: 'Interviews' },
            { v: s.total_matched ?? 0, l: 'Matched' },
            { v: typeof experience === 'number' ? `${experience}yr` : experience, l: 'Experience' },
          ].map(({ v, l }) => (
            <div key={l} className="ps"><div className="psv">{v}</div><div className="psl">{l}</div></div>
          ))}
        </div>
      </div>

      <div className="prof-body">
        {/* Profile completion */}
        <div style={{ margin: '16px 20px 0', background: 'var(--lime-dim)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lime)' }}>Complete your profile</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{profilePct}% done · {resume ? 'Add portfolio to stand out' : 'Upload resume to get started'}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)', cursor: 'pointer' }} onClick={() => setSubView('profile')}>Edit →</div>
          </div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${profilePct}%`, background: 'var(--lime)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* PWA Install Section */}
        <InstallBanner installApp={installApp} isInstallable={isInstallable} />

        {/* Auto-apply status */}
        {prefs && (
          <div style={{ margin: '12px 20px 0', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ti ti-zap" style={{ fontSize: 18, color: prefs.auto_apply_enabled ? 'var(--lime)' : 'var(--text3)' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Auto-Apply</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Min score: {prefs.min_match_score}% · Limit: {user?.daily_apply_limit || prefs.daily_limit || 10}/day</div>
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: prefs.auto_apply_enabled ? '#4ADE80' : 'var(--text3)', background: prefs.auto_apply_enabled ? 'rgba(74,222,128,0.1)' : 'var(--bg3)', border: `1px solid ${prefs.auto_apply_enabled ? 'rgba(74,222,128,0.2)' : 'var(--border)'}`, padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
              {prefs.auto_apply_enabled ? '● On' : '○ Off'}
            </span>
          </div>
        )}

        {/* Account menu */}
        <div className="menu-sec-lbl">Account</div>
        {menuItems.map(({ icon, label, sub, badge, action }) => (
          <div key={label} className="mi" onClick={action}>
            <div className="mi-ico"><i className={`ti ${icon}`} /></div>
            <div className="mi-txt"><div className="mi-lbl">{label}</div><div className="mi-sub">{sub}</div></div>
            {badge && <div className="mi-bdg">{badge}</div>}
            <div className="mi-arr"><i className="ti ti-chevron-right" /></div>
          </div>
        ))}

        {/* Preferences menu */}
        <div className="menu-sec-lbl">Preferences</div>
        {prefItems.map(({ icon, label, sub, action }) => (
          <div key={label} className="mi" onClick={action}>
            <div className="mi-ico"><i className={`ti ${icon}`} /></div>
            <div className="mi-txt"><div className="mi-lbl">{label}</div><div className="mi-sub">{sub}</div></div>
            <div className="mi-arr"><i className="ti ti-chevron-right" /></div>
          </div>
        ))}

        {/* Sign out */}
        <div style={{ height: 12 }} />
        <div className="mi" style={{ borderBottom: 'none' }} onClick={handleSignOut}>
          <div className="mi-ico red"><i className="ti ti-logout" /></div>
          <div className="mi-txt"><div className="mi-lbl" style={{ color: '#F87171' }}>Sign out</div></div>
        </div>
        <div className="sp" />
      </div>
    </div>
  );
}
