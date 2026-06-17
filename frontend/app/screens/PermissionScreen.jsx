'use client';
import { useState, useEffect, useRef } from 'react';
import { notificationsApi } from '../../lib/api';

// Utility helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


// ── Permission definitions ────────────────────────────────────────────────────
const PERMS = [
  {
    id: 'notifications',
    icon: 'ti-bell-ringing',
    gradient: 'linear-gradient(135deg, rgba(184,240,35,0.15) 0%, rgba(184,240,35,0.04) 100%)',
    iconBg: 'rgba(184,240,35,0.15)',
    iconColor: '#B8F023',
    glowColor: 'rgba(184,240,35,0.2)',
    title: 'Stay in the Loop',
    subtitle: 'Notifications',
    desc: 'Get instant alerts when you land a new job match, interview invite, or when auto-apply succeeds.',
    examples: [
      { emoji: '🎯', text: '94% match: Senior Designer at Google' },
      { emoji: '📅', text: 'Interview confirmed with Spotify' },
      { emoji: '✅', text: 'Auto-applied to Netflix — success!' },
    ],
    why: 'So you never miss a high-match opportunity.',
  },
  {
    id: 'camera',
    icon: 'ti-camera',
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(96,165,250,0.04) 100%)',
    iconBg: 'rgba(96,165,250,0.15)',
    iconColor: '#60A5FA',
    glowColor: 'rgba(96,165,250,0.2)',
    title: 'Scan with Camera',
    subtitle: 'Camera Access',
    desc: 'Snap a photo of your resume or business card to instantly upload and parse it with AI.',
    examples: [
      { emoji: '📄', text: 'Scan printed resume to upload' },
      { emoji: '🪪', text: 'Capture business card contacts' },
      { emoji: '🤳', text: 'Set a profile photo' },
    ],
    why: 'To enable resume scanning and profile photos.',
  },
  {
    id: 'microphone',
    icon: 'ti-microphone',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.04) 100%)',
    iconBg: 'rgba(251,191,36,0.15)',
    iconColor: '#FBBF24',
    glowColor: 'rgba(251,191,36,0.2)',
    title: 'Voice Search',
    subtitle: 'Microphone Access',
    desc: 'Search for jobs hands-free using your voice. Just say what role you\'re looking for.',
    examples: [
      { emoji: '🎙️', text: '"Find remote React jobs in Hyderabad"' },
      { emoji: '🔊', text: '"Show me jobs paying above 15 LPA"' },
      { emoji: '💬', text: '"Apply to top matches this week"' },
    ],
    why: 'To enable voice-powered job search.',
  },
  {
    id: 'files',
    icon: 'ti-folder-open',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15) 0%, rgba(167,139,250,0.04) 100%)',
    iconBg: 'rgba(167,139,250,0.15)',
    iconColor: '#A78BFA',
    glowColor: 'rgba(167,139,250,0.2)',
    title: 'Upload Your Resume',
    subtitle: 'File Access',
    desc: 'Pick your resume PDF or DOC directly from your phone storage. AI parses it in seconds.',
    examples: [
      { emoji: '📂', text: 'Upload resume PDF from Downloads' },
      { emoji: '📎', text: 'Attach documents to applications' },
      { emoji: '🗂️', text: 'Import saved cover letters' },
    ],
    why: 'To let you upload and manage your resume files.',
  },
];

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PermissionScreen({ goTo, showToast }) {
  const [step, setStep] = useState(0);
  const [statuses, setStatuses] = useState({});
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef(null);

  // Pre-check existing permissions
  useEffect(() => {
    const s = {};
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') s.notifications = 'granted';
      if (Notification.permission === 'denied')  s.notifications = 'denied';
    }
    setStatuses(s);
  }, []);

  const perm = PERMS[step];

  async function handleAllow() {
    setAsking(true);
    const id = perm.id;

    try {
      if (id === 'notifications') {
        const result = await Notification.requestPermission();
        setStatuses(prev => ({ ...prev, notifications: result }));
        if (result === 'granted') {
          try {
            const reg = await navigator.serviceWorker.ready;
            
            // Try to subscribe to push notification service on backend
            try {
              const keyRes = await notificationsApi.getVapidKey();
              const vapidKey = keyRes.data?.vapidKey;
              
              if (vapidKey) {
                const sub = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(vapidKey)
                });
                
                const subJson = sub.toJSON();
                if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
                  await notificationsApi.subscribe({
                    endpoint: subJson.endpoint,
                    keys: {
                      p256dh: subJson.keys.p256dh,
                      auth: subJson.keys.auth
                    }
                  });
                  console.log('Successfully subscribed to Web Push');
                }
              }
            } catch (pushErr) {
              console.error('Failed to subscribe to Web Push backend:', pushErr);
            }

            await reg.showNotification('JobPilot 🎉', {
              body: 'Notifications are on! We\'ll alert you for new matches and interviews.',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              tag: 'welcome',
            });
          } catch (_) {
            try { new Notification('JobPilot 🎉', { body: 'You\'ll get job alerts now!', icon: '/icons/icon-192x192.png' }); } catch (__) {}
          }
          showToast?.('Notifications enabled!');
        }

      } else if (id === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        stream.getTracks().forEach(t => t.stop()); // stop immediately after getting permission
        setStatuses(prev => ({ ...prev, camera: 'granted' }));
        showToast?.('Camera access granted!');

      } else if (id === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getTracks().forEach(t => t.stop());
        setStatuses(prev => ({ ...prev, microphone: 'granted' }));
        showToast?.('Microphone access granted!');

      } else if (id === 'files') {
        // File access is granted via user gesture (file picker) — show picker
        fileInputRef.current?.click();
        setStatuses(prev => ({ ...prev, files: 'granted' }));
        showToast?.('File access enabled!');
        setAsking(false);
        advance();
        return;
      }
    } catch (err) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setStatuses(prev => ({ ...prev, [id]: denied ? 'denied' : 'error' }));
      if (!denied) showToast?.('Could not access — try again from Settings.');
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

  const curStatus = statuses[perm?.id];
  const isDenied  = curStatus === 'denied';

  // ── Done summary ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center' }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(184,240,35,0.1)', border: '1px solid rgba(184,240,35,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <i className="ti ti-shield-check" style={{ fontSize: 42, color: '#B8F023' }} />
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, color: '#F0F5E8', marginBottom: 8, lineHeight: 1.2 }}>
          All set! <em style={{ color: '#B8F023', fontStyle: 'normal' }}>Let's go.</em>
        </div>
        <div style={{ fontSize: 13, color: '#8BA882', lineHeight: 1.6, marginBottom: 28 }}>
          You can change any permission anytime from Profile → Notification Settings.
        </div>

        {/* Summary grid */}
        <div style={{ width: '100%', background: 'rgba(28,43,28,0.95)', border: '1px solid rgba(184,240,35,0.1)', borderRadius: 16, padding: '16px', marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#556B52', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Permission Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PERMS.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: p.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${p.icon}`} style={{ fontSize: 15, color: p.iconColor }} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#F0F5E8' }}>{p.subtitle}</div>
                </div>
                <StatusBadge status={statuses[p.id] || 'skipped'} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={finish}
          style={{ width: '100%', background: '#B8F023', color: '#0D150D', border: 'none', padding: '15px', borderRadius: 999, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Start finding jobs →
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Permission card ────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px 28px', background: 'var(--bg)' }}>
      {/* Step counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
          {step + 1} of {PERMS.length}
        </div>
        {/* Progress bar */}
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--bg3)', margin: '0 14px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((step + 1) / PERMS.length) * 100}%`, background: perm.iconColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
        <button onClick={handleSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text3)', fontFamily: 'inherit', padding: '2px 0' }}>
          Skip all
        </button>
      </div>

      {/* Icon with glow */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 90, height: 90 }}>
          {/* Glow */}
          <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: perm.glowColor, filter: 'blur(16px)', opacity: 0.6 }} />
          {/* Icon circle */}
          <div style={{ width: 90, height: 90, borderRadius: 26, background: perm.iconBg, border: `1px solid ${perm.glowColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <i className={`ti ${perm.icon}`} style={{ fontSize: 42, color: perm.iconColor }} />
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: perm.iconColor, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{perm.subtitle}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)', lineHeight: 1.2, marginBottom: 8 }}>{perm.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{perm.desc}</div>
      </div>

      {/* Examples */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Use cases</div>
        {perm.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{ex.emoji}</span>
            <span style={{ fontSize: 12, color: 'var(--text1)', fontWeight: 500, flex: 1 }}>{ex.text}</span>
          </div>
        ))}
      </div>

      {/* Why we need this */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(184,240,35,0.05)', border: '1px solid rgba(184,240,35,0.1)', borderRadius: 10, marginBottom: 16 }}>
        <i className="ti ti-lock" style={{ fontSize: 13, color: 'var(--lime)', flexShrink: 0 }} />
        <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>
          <strong style={{ color: 'var(--text1)' }}>Why we need this: </strong>{perm.why}
        </div>
      </div>

      {/* Denied warning */}
      {isDenied && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: '#F87171', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: '#FCA5A5', lineHeight: 1.5 }}>
            Permission blocked. Open <strong>browser Settings → Site permissions</strong> to allow it manually.
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleAllow}
          disabled={asking}
          style={{ width: '100%', background: perm.iconColor, color: '#0D150D', border: 'none', padding: '15px', borderRadius: 999, fontSize: 14, fontWeight: 800, cursor: asking ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: asking ? 0.75 : 1, transition: 'all 0.2s' }}
        >
          {asking
            ? <><i className="ti ti-loader" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }} /> Requesting…</>
            : <><i className={`ti ${perm.icon}`} style={{ fontSize: 16 }} /> Allow {perm.subtitle}</>
          }
        </button>
        <button
          onClick={handleSkip}
          style={{ width: '100%', background: 'none', border: '1px solid var(--border)', padding: '13px', borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
        >
          Not now
        </button>
      </div>

      {/* Hidden file input for file access permission */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
        onChange={() => {}}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    granted: { label: '✓ Allowed', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
    denied:  { label: '✗ Blocked', color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
    skipped: { label: '– Skipped', color: '#556B52', bg: 'var(--bg3)', border: 'var(--border)' },
    error:   { label: '! Error',   color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
  };
  const s = map[status] || map.skipped;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}
