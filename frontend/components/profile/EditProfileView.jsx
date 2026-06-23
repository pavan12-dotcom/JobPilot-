'use client';

/**
 * EditProfileView — sub-view for editing personal profile details.
 * Extracted from ProfileScreen.jsx to keep each file focused and maintainable.
 */
export default function EditProfileView({
  // Form state
  profileName, setProfileName,
  profileEmail, setProfileEmail,
  profilePhone, setProfilePhone,
  linkedinUrl, setLinkedinUrl,
  githubUrl, setGithubUrl,
  portfolioUrl, setPortfolioUrl,
  currentLocation, setCurrentLocation,
  currentRole, setCurrentRole,
  coverLetter, setCoverLetter,
  dailyLimit, setDailyLimit,
  skills, setSkills,
  skillInput, setSkillInput,
  // Resume state
  resume,
  uploadingResume,
  fileInputRef,
  handleReparseResume,
  handleDeleteResume,
  handleUploadResume,
  // Tag helpers
  addTag, removeTag,
  // Actions
  savingProfile,
  handleSaveProfile,
  onBack,
}) {
  const Tag = ({ label, onRemove }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--lime-dim)', color: 'var(--lime)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
      {label}
      <i className="ti ti-x" style={{ fontSize: 9, cursor: 'pointer' }} onClick={onRemove} />
    </span>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button className="bk-btn" onClick={onBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="e.g. Arun Reddy" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {/* Email */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Email</div>
          <input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="e.g. arun@example.com" type="email" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {/* Phone Number */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Phone Number</div>
          <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="e.g. +91 9999999999" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {/* Current Location */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Current Location</div>
          <input value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)} placeholder="e.g. Hyderabad, India" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {/* Current Job Role */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Current Job Role</div>
          <input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="e.g. Senior Software Engineer" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {/* Social Links */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>LinkedIn URL</div>
          <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>GitHub URL</div>
          <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Portfolio URL</div>
          <input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://portfolio.dev" style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
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

        {/* Daily Limit */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Limit</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lime)' }}>{dailyLimit} apps/day</div>
          </div>
          <input type="range" min={1} max={5} value={dailyLimit} onChange={(e) => setDailyLimit(+e.target.value)} style={{ width: '100%' }} />
        </div>

        {/* Cover Letter */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Cover Letter Instructions / Prompt</div>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Provide specific notes or instructions to customize the AI cover letter."
            style={{ width: '100%', height: 100, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--text1)', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Resume Upload */}
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 10 }}>
          <button onClick={onBack} style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', color: 'var(--text2)', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSaveProfile} disabled={savingProfile} style={{ flex: 1.5, background: 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 800, cursor: savingProfile ? 'not-allowed' : 'pointer' }}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
