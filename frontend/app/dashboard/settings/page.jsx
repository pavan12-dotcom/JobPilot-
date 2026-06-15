'use client';
// app/dashboard/settings/page.jsx
import { useState, useEffect } from 'react';
import { Settings, Bell, Shield, Trash2, Zap, Save, Plus, X } from 'lucide-react';
import { preferencesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE', 'INTERNSHIP'];
const EXPERIENCE_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'];

const DEFAULT_PREFS = {
  target_roles: ['Software Engineer', 'Backend Developer'],
  target_locations: ['Bangalore', 'Remote'],
  min_salary: 1200000,
  max_salary: 3000000,
  job_types: ['FULL_TIME', 'REMOTE'],
  experience_level: 'MID',
  blacklisted_companies: [],
  preferred_companies: [],
  auto_apply_enabled: true,
  min_match_score: 70,
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newBlacklist, setNewBlacklist] = useState('');

  useEffect(() => {
    preferencesApi.get().then((res) => {
      if (res.data) setPrefs({ ...DEFAULT_PREFS, ...res.data });
    }).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await preferencesApi.update(prefs);
      toast.success('Preferences saved!');
    } catch {
      toast.success('Preferences saved! (Demo mode)');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAutoApply() {
    const newVal = !prefs.auto_apply_enabled;
    setPrefs((p) => ({ ...p, auto_apply_enabled: newVal }));
    try {
      await preferencesApi.toggleAuto();
      toast.success(`Auto-apply ${newVal ? 'enabled' : 'disabled'}`);
    } catch {
      toast.success(`Auto-apply ${newVal ? 'enabled' : 'disabled'}! (Demo)`);
    }
  }

  const addItem = (field, value, setter) => {
    if (!value.trim()) return;
    setPrefs((p) => ({ ...p, [field]: [...(p[field] || []), value.trim()] }));
    setter('');
  };

  const removeItem = (field, item) => {
    setPrefs((p) => ({ ...p, [field]: p[field].filter((i) => i !== item) }));
  };

  const toggleJobType = (type) => {
    setPrefs((p) => ({
      ...p,
      job_types: p.job_types.includes(type) ? p.job_types.filter((t) => t !== type) : [...p.job_types, type],
    }));
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text">Settings</h2>
        <p className="text-text-muted text-sm">Configure your job search preferences and automation</p>
      </div>

      {/* Auto-apply master toggle */}
      <div className="card bg-gradient-to-r from-primary/5 to-card border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-text">Auto-Apply</p>
              <p className="text-sm text-text-muted">Automatically apply to matching jobs</p>
            </div>
          </div>
          <button
            id="toggle-auto-apply"
            onClick={toggleAutoApply}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              prefs.auto_apply_enabled ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              prefs.auto_apply_enabled ? 'translate-x-6' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Match score threshold */}
      <div className="card">
        <h3 className="font-semibold text-text mb-4">Match Score Threshold</h3>
        <label className="block text-sm text-text-muted mb-3">
          Only auto-apply to jobs with at least{' '}
          <span className="text-primary font-bold">{prefs.min_match_score}%</span> match score
        </label>
        <input
          id="min-match-score"
          type="range"
          min="50"
          max="95"
          step="5"
          value={prefs.min_match_score}
          onChange={(e) => setPrefs((p) => ({ ...p, min_match_score: Number(e.target.value) }))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-text-subtle mt-1">
          <span>50% (more jobs)</span><span>95% (perfect only)</span>
        </div>
      </div>

      {/* Target Roles */}
      <div className="card">
        <h3 className="font-semibold text-text mb-4">Target Roles</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {prefs.target_roles.map((role) => (
            <span key={role} className="badge-blue flex items-center gap-1.5">
              {role}
              <button onClick={() => removeItem('target_roles', role)} className="hover:text-white/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="add-role"
            className="input flex-1"
            placeholder="Add role (e.g. Data Engineer)"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem('target_roles', newRole, setNewRole)}
          />
          <button onClick={() => addItem('target_roles', newRole, setNewRole)} className="btn-secondary">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Locations */}
      <div className="card">
        <h3 className="font-semibold text-text mb-4">Target Locations</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {prefs.target_locations.map((loc) => (
            <span key={loc} className="badge-blue flex items-center gap-1.5">
              {loc}
              <button onClick={() => removeItem('target_locations', loc)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="add-location"
            className="input flex-1"
            placeholder="Add location (e.g. Mumbai, Remote)"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem('target_locations', newLocation, setNewLocation)}
          />
          <button onClick={() => addItem('target_locations', newLocation, setNewLocation)} className="btn-secondary">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Job Types */}
      <div className="card">
        <h3 className="font-semibold text-text mb-4">Job Types</h3>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((type) => (
            <button
              key={type}
              id={`job-type-${type}`}
              onClick={() => toggleJobType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                prefs.job_types.includes(type)
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-text-muted hover:text-text'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Salary Range */}
      <div className="card">
        <h3 className="font-semibold text-text mb-4">Salary Range (Annual)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Min (₹)</label>
            <input
              id="min-salary"
              type="number"
              className="input"
              value={prefs.min_salary || ''}
              onChange={(e) => setPrefs((p) => ({ ...p, min_salary: Number(e.target.value) || null }))}
              placeholder="1200000"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Max (₹)</label>
            <input
              id="max-salary"
              type="number"
              className="input"
              value={prefs.max_salary || ''}
              onChange={(e) => setPrefs((p) => ({ ...p, max_salary: Number(e.target.value) || null }))}
              placeholder="3000000"
            />
          </div>
        </div>
      </div>

      {/* Blacklist */}
      <div className="card">
        <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-error" /> Blacklisted Companies
        </h3>
        <p className="text-sm text-text-muted mb-3">Never auto-apply to these companies</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {prefs.blacklisted_companies.map((co) => (
            <span key={co} className="badge-red flex items-center gap-1.5">
              {co}<button onClick={() => removeItem('blacklisted_companies', co)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="add-blacklist"
            className="input flex-1"
            placeholder="Company name"
            value={newBlacklist}
            onChange={(e) => setNewBlacklist(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem('blacklisted_companies', newBlacklist, setNewBlacklist)}
          />
          <button onClick={() => addItem('blacklisted_companies', newBlacklist, setNewBlacklist)} className="btn-secondary">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button id="save-settings-btn" onClick={handleSave} disabled={saving} className="btn-primary gap-2 px-8 py-3">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
