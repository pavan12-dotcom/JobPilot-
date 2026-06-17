'use client';
import { useState, useEffect } from 'react';
import { dashboardApi, resumeApi, preferencesApi } from '@/lib/api';

export default function ProfileScreen({ goTo, user, showToast, setUser, back }) {
  const [stats, setStats] = useState(null);
  const [resume, setResume] = useState(null);
  const [prefs, setPrefs] = useState(null);

  const name = user?.name || 'Arun Reddy';
  const email = user?.email || 'demo@applyai.dev';
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [statsRes, resumeRes, prefsRes] = await Promise.allSettled([
      dashboardApi.stats(),
      resumeApi.get(),
      preferencesApi.get(),
    ]);
    if (statsRes.status === 'fulfilled') setStats(statsRes.value?.data);
    if (resumeRes.status === 'fulfilled') setResume(resumeRes.value?.data);
    if (prefsRes.status === 'fulfilled') setPrefs(prefsRes.value?.data);
  }

  function handleSignOut() {
    localStorage.removeItem('applyai_token');
    localStorage.removeItem('applyai_user');
    localStorage.removeItem('applyai_onboarded');
    setUser(null);
    goTo('splash');
  }

  const s = stats || { total_applied: 12, interviews: 5, total_matched: 87 };
  const role = resume?.parsed_data?.current_role || user?.role || 'Senior Product Designer';
  const loc = prefs?.target_locations?.[0] || 'Hyderabad, India';
  const experience = resume?.parsed_data?.total_years_experience || '8yr';
  const profilePct = resume ? 90 : 55;

  const menuItems = [
    { icon: 'ti-user', label: 'My Profile', sub: 'Resume, skills, portfolio', badge: null, action: () => showToast('Profile editor coming soon!') },
    { icon: 'ti-file-text', label: 'My Applications', sub: 'Track all applications', badge: s.total_applied || '12', action: () => goTo('saved') },
    { icon: 'ti-bell', label: 'Job Alerts', sub: '3 active alerts', badge: null, action: () => goTo('notifications') },
  ];
  const prefItems = [
    { icon: 'ti-adjustments', label: 'Job Preferences', sub: prefs?.target_roles?.[0] ? `${prefs.target_roles[0]}, +${prefs.target_roles.length - 1}` : 'Role, salary, location', action: () => goTo('onboarding') },
    { icon: 'ti-lock', label: 'Privacy', sub: 'Who can see your profile', action: () => showToast('Privacy settings coming soon!') },
    { icon: 'ti-help', label: 'Help & Support', sub: 'FAQs, contact us', action: () => showToast('Support: support@applyai.dev') },
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
          <div className="ibtn"><i className="ti ti-settings" /></div>
        </div>
        <div className="prof-ava">{initials}</div>
        <div className="prof-name">{name}</div>
        <div className="prof-role">{role}</div>
        <div className="prof-loc"><i className="ti ti-map-pin" />{loc}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{email}</div>

        <div className="prof-stats">
          {[
            { v: s.total_applied || 12, l: 'Applied' },
            { v: s.interviews || 5, l: 'Interviews' },
            { v: s.total_matched || 87, l: 'Matched' },
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
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)', cursor: 'pointer' }} onClick={() => goTo('onboarding')}>Edit →</div>
          </div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${profilePct}%`, background: 'var(--lime)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Auto-apply status */}
        {prefs && (
          <div style={{ margin: '12px 20px 0', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ti ti-zap" style={{ fontSize: 18, color: prefs.auto_apply_enabled ? 'var(--lime)' : 'var(--text3)' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Auto-Apply</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Min score: {prefs.min_match_score}% · Limit: {prefs.daily_limit}/day</div>
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
