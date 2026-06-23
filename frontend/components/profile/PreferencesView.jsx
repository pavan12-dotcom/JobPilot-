'use client';

/**
 * PreferencesView — sub-view for editing job search preferences.
 * Extracted from ProfileScreen.jsx to keep each file focused and maintainable.
 */
export default function PreferencesView({
  // Form state
  targetRoles, setTargetRoles,
  targetLocations, setTargetLocations, targetLocationInput, setTargetLocationInput,
  minSalary, setMinSalary,
  maxSalary, setMaxSalary,
  preferredJobTypes, setPreferredJobTypes,
  experienceLevel, setExperienceLevel,
  autoApplyEnabled, setAutoApplyEnabled,
  minMatchScore, setMinMatchScore,
  blacklistedCompanies, setBlacklistedCompanies,
  blacklistInput, setBlacklistInput,
  // Completion
  completion,
  // Tag helpers
  addTag, removeTag,
  // Actions
  savingPrefs,
  handleSavePrefs,
  showToast,
  onBack,
}) {
  const Tag = ({ label, onRemove }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--lime-dim)', color: 'var(--lime)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
      {label}
      <i className="ti ti-x" style={{ fontSize: 9, cursor: 'pointer' }} onClick={onRemove} />
    </span>
  );

  function toggleJobType(t) {
    setPreferredJobTypes(
      preferredJobTypes.includes(t)
        ? preferredJobTypes.filter((x) => x !== t)
        : [...preferredJobTypes, t]
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button className="bk-btn" onClick={onBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Requires 100% profile completion ({completion?.percent || 0}% complete)</div>
          </div>
          <button
            onClick={() => {
              if (!autoApplyEnabled && (!completion || !completion.isComplete)) {
                showToast(`Profile is only ${completion?.percent || 0}% complete. Fill all fields to enable Auto-Apply: ${completion?.missing?.join(', ') || 'Upload resume, set social URLs, and complete details'}`);
                return;
              }
              setAutoApplyEnabled(!autoApplyEnabled);
            }}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: autoApplyEnabled ? 'var(--lime)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
          >
            <span style={{ position: 'absolute', width: 16, height: 16, background: autoApplyEnabled ? 'var(--bg)' : 'var(--text3)', borderRadius: '50%', top: 4, left: autoApplyEnabled ? 24 : 4, transition: 'left 0.2s' }} />
          </button>
        </div>

        {/* Target Role */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Target Role</div>
          <input
            value={targetRoles[0] || ''}
            onChange={(e) => setTargetRoles(e.target.value ? [e.target.value] : [])}
            placeholder="e.g. Frontend Developer"
            style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '11px 16px', color: 'var(--text1)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
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

        {/* Salary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Min Salary (INR / yr)</div>
            <input value={minSalary} onChange={(e) => setMinSalary(e.target.value)} placeholder="e.g. 800000" type="number" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Max Salary (INR / yr)</div>
            <input value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} placeholder="e.g. 1500000" type="number" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
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

        {/* Experience Level */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Experience Level</div>
          <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
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

        {/* Blacklisted Companies */}
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
          <button onClick={onBack} style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', color: 'var(--text2)', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSavePrefs} disabled={savingPrefs} style={{ flex: 1.5, background: 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 800, cursor: savingPrefs ? 'not-allowed' : 'pointer' }}>
            {savingPrefs ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
