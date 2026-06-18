'use client';
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';



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
      setNotifs(acts.map((a, i) => ({
        id: a.id || i,
        type: a.type || 'match',
        title: a.title || a.message || 'Activity update',
        body: a.subtitle || a.details || '',
        time: timeAgo(a.timestamp || a.created_at),
        unread: i < 3,
      })));
    } catch {
      setNotifs([]);
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
        ) : notifs.length > 0 ? (
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
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-bell-off" style={{ fontSize: 40, color: 'var(--text3)', marginBottom: 12 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>No notifications yet</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 220, lineHeight: 1.5 }}>When auto-apply submits applications or matches are found, they will show up here.</div>
          </div>
        )}
        <div className="sp" />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
