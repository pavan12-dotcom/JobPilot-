'use client';
// app/dashboard/schedules/page.jsx
import { useState, useEffect } from 'react';
import { Calendar, Plus, Play, Pause, Trash2, Clock, X } from 'lucide-react';
import { schedulesApi } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const DEMO_SCHEDULES = [
  { id: 's1', name: 'Morning Job Hunt', cron_expression: '0 9 * * *', max_applications: 5, is_active: true, last_run: new Date(Date.now() - 3600000).toISOString(), next_run: new Date(Date.now() + 79200000).toISOString() },
  { id: 's2', name: 'Evening Remote Check', cron_expression: '0 18 * * 1-5', max_applications: 3, is_active: true, last_run: new Date(Date.now() - 7200000).toISOString(), next_run: new Date(Date.now() + 21600000).toISOString() },
];

const CRON_PRESETS = [
  { label: 'Every morning at 9 AM', value: '0 9 * * *' },
  { label: 'Every evening at 6 PM', value: '0 18 * * *' },
  { label: 'Weekdays only at 9 AM', value: '0 9 * * 1-5' },
  { label: 'Every 4 hours', value: '0 */4 * * *' },
  { label: 'Twice daily (9 AM + 6 PM)', value: '0 9,18 * * *' },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState(DEMO_SCHEDULES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', cron_expression: '0 9 * * *', max_applications: 5 });

  useEffect(() => {
    schedulesApi.list().then((res) => {
      if (res.data?.length > 0) setSchedules(res.data);
    }).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await schedulesApi.create(form);
      setSchedules((prev) => [...prev, res.data]);
      setShowForm(false);
      toast.success('Schedule created!');
    } catch {
      setSchedules((prev) => [...prev, { ...form, id: Date.now(), is_active: true, next_run: new Date(Date.now() + 3600000) }]);
      setShowForm(false);
      toast.success('Schedule created! (Demo mode)');
    }
  }

  async function handleToggle(id) {
    try {
      const res = await schedulesApi.toggle(id);
      setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !s.is_active } : s));
      toast.success('Schedule updated');
    } catch {
      setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !s.is_active } : s));
    }
  }

  async function handleDelete(id) {
    try {
      await schedulesApi.delete(id);
    } catch {}
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success('Schedule deleted');
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text">Auto-Apply Schedules</h2>
          <p className="text-text-muted text-sm">Automate when and how many jobs to apply to</p>
        </div>
        <button id="create-schedule-btn" onClick={() => setShowForm(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> New Schedule
        </button>
      </div>

      {/* Schedules list */}
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="card-hover">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  schedule.is_active ? 'bg-success/10 border border-success/20' : 'bg-border/50 border border-border'
                }`}>
                  <Calendar className={`w-5 h-5 ${schedule.is_active ? 'text-success' : 'text-text-muted'}`} />
                </div>
                <div>
                  <p className="font-semibold text-text">{schedule.name}</p>
                  <p className="text-text-muted text-xs font-mono">{schedule.cron_expression}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`badge ${schedule.is_active ? 'badge-green' : 'badge-gray'}`}>
                  {schedule.is_active ? 'Active' : 'Paused'}
                </span>
                <button
                  id={`toggle-schedule-${schedule.id}`}
                  onClick={() => handleToggle(schedule.id)}
                  className="btn-ghost p-2"
                  title={schedule.is_active ? 'Pause' : 'Resume'}
                >
                  {schedule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  id={`delete-schedule-${schedule.id}`}
                  onClick={() => handleDelete(schedule.id)}
                  className="btn-ghost p-2 text-text-muted hover:text-error"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border text-sm">
              <div>
                <p className="text-text-subtle text-xs mb-0.5">Max applications</p>
                <p className="text-text font-medium">{schedule.max_applications}/run</p>
              </div>
              <div>
                <p className="text-text-subtle text-xs mb-0.5">Last run</p>
                <p className="text-text font-medium">
                  {schedule.last_run ? formatDistanceToNow(new Date(schedule.last_run), { addSuffix: true }) : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-text-subtle text-xs mb-0.5">Next run</p>
                <p className="text-text font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {schedule.next_run ? formatDistanceToNow(new Date(schedule.next_run), { addSuffix: true }) : '—'}
                </p>
              </div>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="card text-center py-16">
            <Calendar className="w-12 h-12 text-text-subtle mx-auto mb-3" />
            <p className="text-text-muted mb-3">No schedules yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Create Your First Schedule</button>
          </div>
        )}
      </div>

      {/* Create schedule modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text">New Schedule</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-card">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Schedule Name</label>
                <input
                  id="schedule-name"
                  className="input"
                  placeholder="Morning Job Hunt"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Frequency</label>
                <select
                  id="schedule-preset"
                  className="input"
                  value={form.cron_expression}
                  onChange={(e) => setForm({ ...form, cron_expression: e.target.value })}
                >
                  {CRON_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <p className="text-xs text-text-subtle mt-1 font-mono">{form.cron_expression}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Max applications per run: <span className="text-primary font-bold">{form.max_applications}</span>
                </label>
                <input
                  id="schedule-max-apps"
                  type="range"
                  min="1"
                  max="20"
                  value={form.max_applications}
                  onChange={(e) => setForm({ ...form, max_applications: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" id="save-schedule-btn" className="btn-primary flex-1">Create Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
