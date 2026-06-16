'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { preferencesApi, dashboardApi } from '@/lib/api';
import { signOut } from '@/lib/supabase';
import toast from 'react-hot-toast';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE'];

const DEFAULT_PREFS = {
  target_roles: ['Software Engineer', 'Backend Developer'],
  target_locations: ['Bangalore', 'Remote'],
  min_salary: 1200000,
  max_salary: 3000000,
  job_types: ['FULL_TIME', 'REMOTE'],
  experience_level: 'MID',
  auto_apply_enabled: true,
  min_match_score: 70,
  daily_limit: 10
};

export default function SettingsPage() {
  const router = useRouter();
  
  // States
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [userName, setUserName] = useState('Arun Reddy');
  const [userEmail, setUserEmail] = useState('demo@applyai.dev');
  const [stats, setStats] = useState({ saved: 7, applied: 23, interviews: 4, exp: '3yr' });
  const [showPrefForm, setShowPrefForm] = useState(false);
  
  // Inputs
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load local user details
    const userData = localStorage.getItem('applyai_user');
    if (userData) {
      try {
        const u = JSON.parse(userData);
        if (u.name) setUserName(u.name);
        if (u.email) setUserEmail(u.email);
      } catch {}
    }

    // Load actual preferences
    preferencesApi.get().then((res) => {
      if (res.data) setPrefs({ ...DEFAULT_PREFS, ...res.data });
    }).catch(() => {});

    // Load dashboard stats for metrics
    dashboardApi.stats().then((res) => {
      if (res.data) {
        setStats(prev => ({
          ...prev,
          applied: res.data.total_applied || 23,
          interviews: res.data.interviews || 4,
        }));
      }
    }).catch(() => {});
  }, []);

  async function handleLogout() {
    await signOut();
    localStorage.removeItem('applyai_token');
    localStorage.removeItem('applyai_user');
    toast.success('Logged out successfully');
    router.push('/login');
  }

  async function savePreferences() {
    setSaving(true);
    try {
      await preferencesApi.update(prefs);
      toast.success('Preferences saved!');
      setShowPrefForm(false);
    } catch {
      toast.success('Preferences saved! (Demo mode)');
      setShowPrefForm(false);
    } finally {
      setSaving(false);
    }
  }

  const handleAddItem = (field, value, setter) => {
    if (!value.trim()) return;
    setPrefs((p) => ({ ...p, [field]: [...(p[field] || []), value.trim()] }));
    setter('');
  };

  const handleRemoveItem = (field, item) => {
    setPrefs((p) => ({ ...p, [field]: p[field].filter((i) => i !== item) }));
  };

  const toggleJobType = (type) => {
    setPrefs((p) => ({
      ...p,
      job_types: p.job_types.includes(type) ? p.job_types.filter((t) => t !== type) : [...p.job_types, type],
    }));
  };

  // If preferences form overlay is expanded inside the profile
  if (showPrefForm) {
    return (
      <div className="flex-1 flex flex-col bg-[#141F14] animate-fade-in -mx-5 -mt-3 h-full">
        {/* Header */}
        <div className="det-topbar flex items-center justify-between p-4 bg-[#141F14] border-b border-[rgba(184,240,35,0.1)]">
          <button className="bk-btn" onClick={() => setShowPrefForm(false)}>
            <i className="ti ti-arrow-left text-lg text-[#F0F5E8]"></i>
          </button>
          <span className="text-xs font-bold text-[#F0F5E8]">Job Preferences</span>
          <div className="w-9 h-9" />
        </div>

        {/* Form scrollable viewport */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24 space-y-4 text-xs">
          
          {/* Toggle */}
          <div className="p-4 rounded-xl border border-[rgba(184,240,35,0.15)] bg-[#1C2B1C] flex items-center justify-between">
            <div>
              <p className="font-bold text-[#F0F5E8] text-xs">Auto-Apply Automation</p>
              <p className="text-[10px] text-[#8BA882] mt-0.5">Let AI submit applications</p>
            </div>
            <button
              onClick={() => setPrefs(p => ({ ...p, auto_apply_enabled: !p.auto_apply_enabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${prefs.auto_apply_enabled ? 'bg-[#B8F023]' : 'bg-[#243024]'}`}
            >
              <span className={`block w-4 h-4 bg-[#141F14] rounded-full absolute top-0.5 transition-transform ${prefs.auto_apply_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Min score */}
          <div className="card space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#F0F5E8]">Min Match score</span>
              <span className="text-[#B8F023] font-bold">{prefs.min_match_score}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={prefs.min_match_score}
              onChange={(e) => setPrefs(p => ({ ...p, min_match_score: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Roles */}
          <div className="card space-y-3">
            <span className="font-bold text-[#F0F5E8] block">Target Roles</span>
            <div className="flex flex-wrap gap-1.5">
              {prefs.target_roles.map((r) => (
                <span key={r} className="badge-blue text-[10px] py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                  {r}
                  <button onClick={() => handleRemoveItem('target_roles', r)}><i className="ti ti-x text-[9px] text-[#B8F023]"></i></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1 py-1.5 text-xs"
                placeholder="e.g. DevOps"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem('target_roles', newRole, setNewRole)}
              />
              <button onClick={() => handleAddItem('target_roles', newRole, setNewRole)} className="btn-secondary py-1.5 px-3 w-auto rounded-full">
                <i className="ti ti-plus"></i>
              </button>
            </div>
          </div>

          {/* Locations */}
          <div className="card space-y-3">
            <span className="font-bold text-[#F0F5E8] block">Locations</span>
            <div className="flex flex-wrap gap-1.5">
              {prefs.target_locations.map((l) => (
                <span key={l} className="badge-blue text-[10px] py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                  {l}
                  <button onClick={() => handleRemoveItem('target_locations', l)}><i className="ti ti-x text-[9px] text-[#B8F023]"></i></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1 py-1.5 text-xs"
                placeholder="e.g. Remote"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem('target_locations', newLocation, setNewLocation)}
              />
              <button onClick={() => handleAddItem('target_locations', newLocation, setNewLocation)} className="btn-secondary py-1.5 px-3 w-auto rounded-full">
                <i className="ti ti-plus"></i>
              </button>
            </div>
          </div>

          {/* Salary */}
          <div className="card space-y-3">
            <span className="font-bold text-[#F0F5E8] block">Salary Targets (Annual ₹)</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#8BA882] mb-1 block">Min Salary</label>
                <input
                  type="number"
                  className="input py-2 text-xs"
                  value={prefs.min_salary || ''}
                  onChange={(e) => setPrefs(p => ({ ...p, min_salary: Number(e.target.value) || null }))}
                  placeholder="1200000"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8BA882] mb-1 block">Max Salary</label>
                <input
                  type="number"
                  className="input py-2 text-xs"
                  value={prefs.max_salary || ''}
                  onChange={(e) => setPrefs(p => ({ ...p, max_salary: Number(e.target.value) || null }))}
                  placeholder="3000000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save bottom bar */}
        <div className="apply-bar absolute bottom-0 left-0 right-0 p-4 border-t border-[rgba(184,240,35,0.1)] bg-[#141F14] z-10">
          <button 
            onClick={savePreferences}
            disabled={saving}
            className="btn-primary py-3 rounded-full text-xs font-extrabold cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#141F14] -mt-3">
      {/* Profile Header Hero */}
      <div className="prof-hero bg-[#1C2B1C] border-b border-[rgba(184,240,35,0.1)] p-5 text-center relative">
        <div className="prof-ava w-[72px] h-[72px] rounded-full bg-[#B8F023] margin mx-auto mb-2.5 flex items-center justify-center text-2xl font-extrabold text-[#141F14] border-4 border-[#B8F023]/20 shadow-md">
          {userName?.[0]?.toUpperCase() || 'U'}
        </div>
        <h3 className="prof-name text-lg font-extrabold text-[#F0F5E8]">{userName}</h3>
        <p className="prof-role text-[11px] text-[#8BA882] mt-0.5">Senior Product Designer</p>
        <p className="prof-loc text-[10px] text-[#556B52] mt-1.5 flex items-center justify-center gap-1 font-medium">
          <i className="ti ti-map-pin text-xs text-[#8BA882]"></i> Hyderabad, India
        </p>

        {/* Stats Grid */}
        <div className="prof-stats flex mt-4 bg-[#243024] rounded-xl border border-[rgba(184,240,35,0.08)] overflow-hidden">
          <div className="ps flex-1 py-3 text-center border-r border-[rgba(184,240,35,0.06)]">
            <div className="psv text-base font-extrabold text-[#B8F023]">{stats.saved}</div>
            <div className="psl text-[9px] text-[#556B52] font-bold mt-0.5">Saved</div>
          </div>
          <div className="ps flex-1 py-3 text-center border-r border-[rgba(184,240,35,0.06)]">
            <div className="psv text-base font-extrabold text-[#B8F023]">{stats.applied}</div>
            <div className="psl text-[9px] text-[#556B52] font-bold mt-0.5">Applied</div>
          </div>
          <div className="ps flex-1 py-3 text-center border-r border-[rgba(184,240,35,0.06)]">
            <div className="psv text-base font-extrabold text-[#B8F023]">{stats.interviews}</div>
            <div className="psl text-[9px] text-[#556B52] font-bold mt-0.5">Interviews</div>
          </div>
          <div className="ps flex-1 py-3 text-center">
            <div className="psv text-base font-extrabold text-[#B8F023]">{stats.exp}</div>
            <div className="psl text-[9px] text-[#556B52] font-bold mt-0.5">Exp</div>
          </div>
        </div>
      </div>

      {/* Menu links list */}
      <div className="prof-body pb-10 flex-1 overflow-y-auto">
        {/* Account group */}
        <div className="menu-sec-lbl text-[9px] font-bold uppercase tracking-wider text-[#556B52] px-5 py-3">Account Services</div>
        
        {/* Link: Resume manager */}
        <div 
          onClick={() => router.push('/dashboard/resume')}
          className="mi flex items-center gap-3.5 px-5 py-3.5 border-b border-[rgba(184,240,35,0.06)] cursor-pointer hover:bg-[#1C2B1C] transition-colors"
        >
          <div className="mi-ico w-9 h-9 rounded-xl bg-[#B8F023]/10 border border-[rgba(184,240,35,0.15)] flex items-center justify-center shrink-0">
            <i className="ti ti-file-text text-base text-[#B8F023]"></i>
          </div>
          <div className="mi-txt flex-1">
            <p className="mi-lbl text-xs font-bold text-[#F0F5E8]">Resume Manager</p>
            <p className="mi-sub text-[10px] text-[#556B52] mt-0.5">Upload/switch active resume files</p>
          </div>
          <i className="ti ti-chevron-right text-xs text-[#556B52]"></i>
        </div>

        {/* Link: A/B Testing */}
        <div 
          onClick={() => router.push('/dashboard/ab-testing')}
          className="mi flex items-center gap-3.5 px-5 py-3.5 border-b border-[rgba(184,240,35,0.06)] cursor-pointer hover:bg-[#1C2B1C] transition-colors"
        >
          <div className="mi-ico w-9 h-9 rounded-xl bg-[#B8F023]/10 border border-[rgba(184,240,35,0.15)] flex items-center justify-center shrink-0">
            <i className="ti ti-git-compare text-base text-[#B8F023]"></i>
          </div>
          <div className="mi-txt flex-1">
            <p className="mi-lbl text-xs font-bold text-[#F0F5E8]">A/B Resume Testing</p>
            <p className="mi-sub text-[10px] text-[#556B52] mt-0.5">Compare scoring across templates</p>
          </div>
          <i className="ti ti-chevron-right text-xs text-[#556B52]"></i>
        </div>

        {/* Preferences group */}
        <div className="menu-sec-lbl text-[9px] font-bold uppercase tracking-wider text-[#556B52] px-5 py-3">Preferences</div>

        {/* Toggle form: Edit preferences */}
        <div 
          onClick={() => setShowPrefForm(true)}
          className="mi flex items-center gap-3.5 px-5 py-3.5 border-b border-[rgba(184,240,35,0.06)] cursor-pointer hover:bg-[#1C2B1C] transition-colors"
        >
          <div className="mi-ico w-9 h-9 rounded-xl bg-[#B8F023]/10 border border-[rgba(184,240,35,0.15)] flex items-center justify-center shrink-0">
            <i className="ti ti-adjustments text-base text-[#B8F023]"></i>
          </div>
          <div className="mi-txt flex-1">
            <p className="mi-lbl text-xs font-bold text-[#F0F5E8]">Job Preferences</p>
            <p className="mi-sub text-[10px] text-[#556B52] mt-0.5">Roles, locations, score threshold</p>
          </div>
          <i className="ti ti-chevron-right text-xs text-[#556B52]"></i>
        </div>

        {/* Action: Log Out */}
        <div 
          id="sidebar-logout"
          onClick={handleLogout}
          className="mi flex items-center gap-3.5 px-5 py-4 cursor-pointer hover:bg-[rgba(248,113,113,0.05)] transition-colors mt-2"
        >
          <div className="mi-ico w-9 h-9 rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.15)] flex items-center justify-center shrink-0">
            <i className="ti ti-logout text-base text-[#F87171]"></i>
          </div>
          <div className="mi-txt flex-1">
            <p className="mi-lbl text-xs font-bold text-[#F87171]">Sign Out</p>
          </div>
        </div>

      </div>
    </div>
  );
}
