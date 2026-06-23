'use client';
import { useState } from 'react';

/**
 * PrivacyView — sub-view for privacy settings.
 * Extracted from ProfileScreen.jsx to keep each file focused and maintainable.
 */
export default function PrivacyView({ showToast, onBack }) {
  const [recruiterVisibility, setRecruiterVisibility] = useState(true);
  const [incognitoMode, setIncognitoMode] = useState(false);

  function handleSave() {
    showToast('Privacy settings saved!');
    onBack();
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button className="bk-btn" onClick={onBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 18, color: 'var(--text1)' }} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 850, color: 'var(--text1)', letterSpacing: -0.2 }}>Privacy Settings</span>
        <button
          onClick={handleSave}
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

        <div style={{ background: 'rgba(225, 62, 62, 0.04)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', padding: 14, fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
          <i className="ti ti-info-circle" style={{ color: 'var(--lime)', marginRight: 6 }} />
          Privacy settings apply automatically across all browser agents executing applications. Masking your email might delay some notifications from employers who do not parse redirect logs correctly.
        </div>

        {/* Save & cancel */}
        <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20 }}>
          <button onClick={onBack} style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', color: 'var(--text2)', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1.5, background: 'var(--lime)', color: 'var(--bg)', border: 'none', padding: '13px 0', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
