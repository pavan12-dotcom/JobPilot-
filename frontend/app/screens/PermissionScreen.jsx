'use client';
import { useState, useEffect } from 'react';

const PERMS = [
  {
    id: 'notifications',
    icon: 'ti-bell-ringing',
    iconBg: 'rgba(184,240,35,0.12)',
    iconColor: 'var(--lime)',
    title: 'Job Alerts',
    subtitle: 'Allow notifications',
    desc: 'Get instant alerts when we find a high-match job, when you land an interview, or when an auto-apply succeeds.',
    examples: ['🎯 94% match: Sr. Designer at Google', '📅 Interview confirmed with Spotify', '✅ Auto-applied to Netflix — success'],
    required: false,
  },
];

export default function PermissionScreen({ goTo, showToast }) {
  const [step, setStep] = useState(0);   // which permission card
  const [statuses, setStatuses] = useState({});  // id → 'granted' | 'denied' | 'pending'
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Pre-check existing permission states
    const s = {};
    if (typeof Notification !== 'undefined') {
      s.notifications = Notification.permission;  // 'default' | 'granted' | 'denied'
    }
    setStatuses(s);
    // If notification already granted, skip straight to done
    if (s.notifications === 'granted') {
      setDone(true);
    }
  }, []);

  const perm = PERMS[step];

  async function handleAllow() {
    setAsking(true);
    const id = perm.id;

    if (id === 'notifications') {
      try {
        const result = await Notification.requestPermission();
        setStatuses(prev => ({ ...prev, notifications: result }));
        if (result === 'granted') {
          // Fire a welcome notification
          try {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification('JobPilot Notifications On 🎉', {
              body: 'You\'ll now get alerts for new matches, interviews, and application updates.',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              tag: 'welcome',
              data: { url: '/' },
            });
          } catch (_) {
            new Notification('JobPilot Notifications On 🎉', {
              body: 'You\'ll get alerts for new matches and interview updates.',
              icon: '/icons/icon-192x192.png',
            });
          }
          showToast?.('Notifications enabled! We\'ll keep you posted.');
        }
      } catch (err) {
        setStatuses(prev => ({ ...prev, notifications: 'denied' }));
      }
    }

    setAsking(false);
    advance();
  }

  function handleSkip() {
    setStatuses(prev => ({ ...prev, [perm.id]: 'skipped' }));
    advance();
  }

  function advance() {
    if (step < PERMS.length - 1) {
      setStep(s => s + 1);
    } else {
      setDone(true);
    }
  }

  function finish() {
    localStorage.setItem('jobpilot_permissions_done', '1');
    goTo('home');
  }

  const notifStatus = statuses.notifications;
  const isGranted = notifStatus === 'granted';
  const isDenied  = notifStatus === 'denied';

  // ── Done state ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center', gap: 0 }}>
        {/* Success ring */}
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(184,240,35,0.1)', border: '1px solid rgba(184,240,35,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <i className="ti ti-check" style={{ fontSize: 44, color: 'var(--lime)' }} />
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text1)', marginBottom: 10, lineHeight: 1.2 }}>
          You're all <em style={{ color: 'var(--lime)', fontStyle: 'normal' }}>set!</em>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 36 }}>
          {isGranted
            ? 'Notifications are on. JobPilot will alert you the moment something important happens.'
            : 'You can always enable notifications later from your Profile settings.'}
        </div>

        {/* Summary */}
        <div style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Permission summary</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--lime-dim)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-bell" style={{ fontSize: 15, color: 'var(--lime)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)' }}>Notifications</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Job alerts & application updates</div>
            </div>
            <StatusBadge status={isGranted ? 'granted' : isDenied ? 'denied' : 'skipped'} />
          </div>
        </div>

        <button
          onClick={finish}
          style={{ width: '100%', background: 'var(--lime)', color: '#0D150D', border: 'none', padding: '15px', borderRadius: 'var(--radius-full)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
        >
          Start finding jobs →
        </button>
      </div>
    );
  }

  // ── Permission card ────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 32px' }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
        {PERMS.map((_, i) => (
          <div
            key={i}
            style={{ height: 4, borderRadius: 2, background: i <= step ? 'var(--lime)' : 'var(--bg3)', width: i === step ? 24 : 8, transition: 'all 0.3s ease' }}
          />
        ))}
      </div>

      {/* Icon */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ width: 88, height: 88, borderRadius: 24, background: perm.iconBg, border: '1px solid rgba(184,240,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <i className={`ti ${perm.icon}`} style={{ fontSize: 40, color: perm.iconColor }} />
          {/* Pulse ring */}
          <div style={{ position: 'absolute', inset: -8, borderRadius: 32, border: '1px solid rgba(184,240,35,0.12)', animation: 'pulse-ring 2s ease-out infinite' }} />
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{perm.subtitle}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)', lineHeight: 1.2, marginBottom: 10 }}>{perm.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{perm.desc}</div>
      </div>

      {/* Example notifications preview */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Example alerts</div>
        {perm.examples.map((ex, i) => (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', borderRadius: 10, padding: '9px 11px', border: '1px solid var(--border)' }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--lime-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-bell" style={{ fontSize: 13, color: 'var(--lime)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 1 }}>JobPilot</div>
              <div style={{ fontSize: 11, color: 'var(--text1)', fontWeight: 500 }}>{ex}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Already denied warning */}
      {isDenied && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <i className="ti ti-info-circle" style={{ fontSize: 15, color: '#F87171', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: '#FCA5A5', lineHeight: 1.5 }}>
            Notifications are blocked. To enable them, open your browser settings and allow notifications for this site.
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!isDenied ? (
          <button
            onClick={handleAllow}
            disabled={asking}
            style={{ width: '100%', background: 'var(--lime)', color: '#0D150D', border: 'none', padding: '15px', borderRadius: 'var(--radius-full)', fontSize: 15, fontWeight: 800, cursor: asking ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: asking ? 0.7 : 1, transition: 'all 0.2s' }}
          >
            {asking ? (
              <><i className="ti ti-loader" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }} /> Requesting…</>
            ) : (
              <><i className="ti ti-bell" style={{ fontSize: 16 }} /> Allow Notifications</>
            )}
          </button>
        ) : (
          <button
            onClick={advance}
            style={{ width: '100%', background: 'var(--lime)', color: '#0D150D', border: 'none', padding: '15px', borderRadius: 'var(--radius-full)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Continue anyway →
          </button>
        )}

        <button
          onClick={handleSkip}
          style={{ width: '100%', background: 'none', border: '1px solid var(--border)', padding: '13px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600, color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
        >
          Not now
        </button>
      </div>

      {/* Inline animations */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          70%  { transform: scale(1.12); opacity: 0; }
          100% { transform: scale(1.12); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    granted: { label: 'Allowed', bg: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: 'rgba(74,222,128,0.2)' },
    denied:  { label: 'Blocked', bg: 'rgba(248,113,113,0.1)', color: '#F87171', border: 'rgba(248,113,113,0.2)' },
    skipped: { label: 'Skipped', bg: 'var(--bg3)', color: 'var(--text3)', border: 'var(--border)' },
  };
  const s = map[status] || map.skipped;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: 999 }}>
      {s.label}
    </span>
  );
}
