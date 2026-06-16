'use client';
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';

const DEMO_NOTIFS = [
  { id: 1, type: 'match', title: 'New match: Product Designer at Google', body: '95% match with your profile. 234 applicants so far.', time: '2 minutes ago', unread: true },
  { id: 2, type: 'apply', title: 'Application viewed by Netflix', body: 'Netflix reviewed your Frontend Engineer application.', time: '1 hour ago', unread: true },
  { id: 3, type: 'interview', title: 'Interview scheduled with Spotify', body: 'Video interview on June 20 at 10:00 AM IST.', time: '3 hours ago', unread: true },
  { id: 4, type: 'view', title: 'Your profile is trending', body: '12 recruiters viewed your profile this week.', time: 'Yesterday', unread: false },
  { id: 5, type: 'mail', title: 'Message from Meta recruiter', body: '"Hi, we\'d love to discuss the Data Scientist role…"', time: '2 days ago', unread: false },
];

const ICON_MAP = {
  match:     { icon: 'ti-briefcase', bg: 'var(--lime-dim)', border: 'var(--border2)', color: 'var(--lime)' },
  apply:     { icon: 'ti-check', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.15)', color: '#4ADE80' },
  interview: { icon: 'ti-calendar', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.15)', color: '#FCD34D' },
  view:      { icon: 'ti-star', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.15)', color: '#93C5FD' },
  mail:      { icon: 'ti-mail', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.15)', color: '#A78BFA' },
};

export default function NotificationsScreen({ back }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifs();
  }, []);

  async function loadNotifs() {
    try {
      const res = await dashboardApi.activity(10);
      const acts = res?.data || [];
      if (acts.length > 0) {
        setNotifs(acts.map((a, i) => ({
          id: a.id || i,
          type: a.type || 'match',
          title: a.message || a.description || 'Activity update',
          body: a.details || '',
          time: timeAgo(a.created_at),
          unread: i < 3,
        })));
      } else {
        setNotifs(DEMO_NOTIFS);
      }
    } catch {
      setNotifs(DEMO_NOTIFS);
    } finally {
      setLoading(false);
    }
  }

  function timeAgo(iso) {
    if (!iso) return 'recently';
    const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  }

  return (
    <>
      <div className="topbar">
        <button className="bk-btn" onClick={back}><i className="ti ti-arrow-left" /></button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1)' }}>Notifications</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lime)', cursor: 'pointer' }} onClick={() => setNotifs((n) => n.map((x) => ({ ...x, unread: false })))}>Mark all read</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 13 }}>
            <i className="ti ti-loader" style={{ fontSize: 24, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
            Loading…
          </div>
        ) : (
          notifs.map((n) => {
            const ic = ICON_MAP[n.type] || ICON_MAP.match;
            return (
              <div key={n.id} className={`notif ${n.unread ? 'unread' : ''}`} onClick={() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, unread: false } : x))}>
                <div className="notif-ico" style={{ background: ic.bg, border: `1px solid ${ic.border}` }}>
                  <i className={`ti ${ic.icon}`} style={{ color: ic.color }} />
                </div>
                <div className="notif-txt">
                  <div className="notif-t">{n.title}</div>
                  {n.body && <div className="notif-s">{n.body}</div>}
                  <div className="notif-time">{n.time}</div>
                </div>
                {n.unread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            );
          })
        )}
        <div className="sp" />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
