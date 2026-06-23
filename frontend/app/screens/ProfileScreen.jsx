'use client';
import { useState, useEffect, useRef } from 'react';
import { dashboardApi, resumeApi, preferencesApi, authApi } from '@/lib/api';
import EditProfileView from '@/components/profile/EditProfileView';
import PreferencesView from '@/components/profile/PreferencesView';
import PrivacyView from '@/components/profile/PrivacyView';

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
      <div style={{ margin: '12px 20px 0', background: 'linear-gradient(135deg, var(--lime-dim) 0%, rgba(225, 62, 62, 0.05) 100%)', border: '1px solid var(--lime)', borderRadius: 'var(--radius-md)', padding: '14px 16px', boxShadow: '0 4px 20px rgba(225, 62, 62, 0.08)' }}>
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
      <div style={{ margin: '12px 20px 0', background: 'linear-gradient(135deg, var(--lime-dim) 0%, rgba(225, 62, 62, 0.04) 100%)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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
            <div style={{ background: 'rgba(225, 62, 62, 0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
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
  const [dailyLimit, setDailyLimit] = useState(5);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);

  // Job Preferences Form State
  const [targetRoles, setTargetRoles] = useState([]);
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
  const [completion, setCompletion] = useState({ percent: 0, isComplete: false, missing: [] });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const name = user?.name || 'Loading...';
  const email = user?.email || 'Loading...';
  const initials = name && name !== 'Loading...' ? name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'AR';

  useEffect(() => { loadData(); }, [user]);

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
      if (prefsRes.value.completion) setCompletion(prefsRes.value.completion);
    }

    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
    setDailyLimit(user?.daily_apply_limit || 10);

    if (activeResume?.parsed_data) {
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

  function addTag(state, setState, val, setInputVal) {
    const trimmed = val.trim();
    if (!trimmed) return;
    setState([...new Set([...state, trimmed])]);
    if (setInputVal) setInputVal('');
  }

  function removeTag(state, setState, val) {
    setState(state.filter((x) => x !== val));
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const profileData = { name: profileName, email: profileEmail, daily_apply_limit: Number(dailyLimit) };
      const parsedDataUpdate = { name: profileName, email: profileEmail, phone: profilePhone, linkedin_url: linkedinUrl, github_url: githubUrl, portfolio_url: portfolioUrl, current_location: currentLocation, skills, current_role: currentRole, cover_letter: coverLetter };

      const updatePromises = [authApi.updateProfile(profileData)];
      if (resume?.id) updatePromises.push(resumeApi.update(resume.id, { parsed_data: parsedDataUpdate }));

      const [uRes] = await Promise.all(updatePromises);
      if (uRes?.success) {
        setUser(uRes.data);
        localStorage.setItem('applyai_user', JSON.stringify(uRes.data));
      }
      if (resume) setResume({ ...resume, parsed_data: { ...resume.parsed_data, ...parsedDataUpdate } });

      showToast('Profile updated successfully!');
      setSubView('main');
    } catch (err) {
      showToast(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePrefs() {
    setSavingPrefs(true);
    try {
      const updatedPrefs = {
        target_roles: targetRoles, target_locations: targetLocations,
        min_salary: minSalary ? Number(minSalary) : null, max_salary: maxSalary ? Number(maxSalary) : null,
        job_types: preferredJobTypes, experience_level: experienceLevel,
        auto_apply_enabled: autoApplyEnabled, min_match_score: Number(minMatchScore),
        blacklisted_companies: blacklistedCompanies,
      };
      const res = await preferencesApi.update(updatedPrefs);
      setPrefs(updatedPrefs);
      if (res?.completion) setCompletion(res.completion);
      showToast('Preferences updated successfully!');
      setSubView('main');
    } catch (err) {
      showToast(err.message || 'Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  }

  // ── Sub-view routing ──────────────────────────────────────
  const commonProps = { addTag, removeTag };

  if (subView === 'profile') {
    return (
      <EditProfileView
        {...commonProps}
        profileName={profileName} setProfileName={setProfileName}
        profileEmail={profileEmail} setProfileEmail={setProfileEmail}
        profilePhone={profilePhone} setProfilePhone={setProfilePhone}
        linkedinUrl={linkedinUrl} setLinkedinUrl={setLinkedinUrl}
        githubUrl={githubUrl} setGithubUrl={setGithubUrl}
        portfolioUrl={portfolioUrl} setPortfolioUrl={setPortfolioUrl}
        currentLocation={currentLocation} setCurrentLocation={setCurrentLocation}
        currentRole={currentRole} setCurrentRole={setCurrentRole}
        coverLetter={coverLetter} setCoverLetter={setCoverLetter}
        dailyLimit={dailyLimit} setDailyLimit={setDailyLimit}
        skills={skills} setSkills={setSkills}
        skillInput={skillInput} setSkillInput={setSkillInput}
        resume={resume} uploadingResume={uploadingResume} fileInputRef={fileInputRef}
        handleReparseResume={handleReparseResume}
        handleDeleteResume={handleDeleteResume}
        handleUploadResume={handleUploadResume}
        savingProfile={savingProfile} handleSaveProfile={handleSaveProfile}
        onBack={() => setSubView('main')}
      />
    );
  }

  if (subView === 'preferences') {
    return (
      <PreferencesView
        {...commonProps}
        targetRoles={targetRoles} setTargetRoles={setTargetRoles}
        targetLocations={targetLocations} setTargetLocations={setTargetLocations}
        targetLocationInput={targetLocationInput} setTargetLocationInput={setTargetLocationInput}
        minSalary={minSalary} setMinSalary={setMinSalary}
        maxSalary={maxSalary} setMaxSalary={setMaxSalary}
        preferredJobTypes={preferredJobTypes} setPreferredJobTypes={setPreferredJobTypes}
        experienceLevel={experienceLevel} setExperienceLevel={setExperienceLevel}
        autoApplyEnabled={autoApplyEnabled} setAutoApplyEnabled={setAutoApplyEnabled}
        minMatchScore={minMatchScore} setMinMatchScore={setMinMatchScore}
        blacklistedCompanies={blacklistedCompanies} setBlacklistedCompanies={setBlacklistedCompanies}
        blacklistInput={blacklistInput} setBlacklistInput={setBlacklistInput}
        completion={completion}
        savingPrefs={savingPrefs} handleSavePrefs={handleSavePrefs}
        showToast={showToast}
        onBack={() => setSubView('main')}
      />
    );
  }

  if (subView === 'privacy') {
    return <PrivacyView showToast={showToast} onBack={() => setSubView('main')} />;
  }

  // ── Main View ─────────────────────────────────────────────
  const s = stats || { total_applied: 0, interviews: 0, total_matched: 0 };
  const role = resume?.parsed_data?.current_role || user?.role || 'Not specified';
  const loc = prefs?.target_locations?.[0] || 'Not specified';
  const experience = resume?.parsed_data?.total_experience_years !== undefined
    ? `${resume.parsed_data.total_experience_years}yr` : '0yr';
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
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Min score: {prefs.min_match_score}% · Limit: {user?.daily_apply_limit || prefs.daily_limit || 5}/day</div>
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
