'use client';

import { useState, useEffect, useRef } from 'react';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import SavedScreen from './screens/SavedScreen';
import DetailScreen from './screens/DetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';

const NO_NAV = ['splash', 'login', 'onboarding', 'detail', 'notifications'];
const MAIN_TABS = ['home', 'search', 'saved', 'profile'];

export default function JobPilotApp() {
  const [cur, setCur] = useState('splash');
  const [prev, setPrev] = useState(null);
  const [animDir, setAnimDir] = useState('forward');
  const [user, setUser] = useState(null);
  const [time, setTime] = useState('9:41');
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [selectedJob, setSelectedJob] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const toastTimeout = useRef(null);
  const hist = useRef(['splash']);
  const goToRef = useRef(null);

  // Mount check + detect OAuth callback (PKCE uses ?code= query param)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('code') || window.location.hash.includes('access_token')) {
        setAuthLoading(true);
      }
      if (params.get('auth_error') === 'true') {
        showToast('Google Sign-In failed. Check Supabase/Google configuration.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Sync Supabase Auth session
  useEffect(() => {
    if (!supabase) return;

    // Handle OAuth callback on page load (token in URL hash)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const token = session.access_token;
        localStorage.setItem('applyai_token', token);
        await syncUserFromSession(session);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('applyai_token');
        localStorage.removeItem('applyai_user');
        setUser(null);
        return;
      }
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        const token = session.access_token;
        localStorage.setItem('applyai_token', token);
        await syncUserFromSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function syncUserFromSession(session) {
    let userObj = null;
    try {
      const userRes = await authApi.me();
      userObj = userRes.data;
    } catch (err) {
      console.warn('Backend sync failed, using Supabase user data:', err?.message);
      const su = session.user;
      userObj = {
        id: su.id,
        email: su.email,
        name: su.user_metadata?.full_name || su.user_metadata?.name || su.email?.split('@')[0],
        avatar_url: su.user_metadata?.avatar_url || null,
      };
    }
    if (!userObj) { setAuthLoading(false); return; }
    localStorage.setItem('applyai_user', JSON.stringify(userObj));
    setUser(userObj);
    setAuthLoading(false);
    // Always use the latest goTo via ref to avoid stale closure
    const navigate = goToRef.current;
    const onboarded = localStorage.getItem('applyai_onboarded');
    navigate(onboarded ? 'home' : 'onboarding');
  }


  // Auth check on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' && localStorage.getItem('applyai_token');
    const userData = typeof window !== 'undefined' && localStorage.getItem('applyai_user');
    if (token && userData) {
      try { setUser(JSON.parse(userData)); } catch {}
      setCur('home');
      hist.current = ['home'];
    }
  }, []);

  // Live clock
  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  function goTo(screen) {
    if (screen === cur) return;
    setAnimDir('forward');
    setPrev(cur);
    hist.current.push(screen);
    setCur(screen);
  }
  // Keep ref always pointing to latest goTo
  goToRef.current = goTo;

  // Clear prev screen after transition animation completes to prevent overlapping
  useEffect(() => {
    if (cur) {
      const timer = setTimeout(() => {
        setPrev(null);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [cur]);


  function back() {
    if (hist.current.length <= 1) return;
    hist.current.pop();
    const prevScreen = hist.current[hist.current.length - 1];
    setAnimDir('back');
    setPrev(cur);
    setCur(prevScreen);
  }

  function showToast(msg) {
    clearTimeout(toastTimeout.current);
    setToast({ show: true, msg });
    toastTimeout.current = setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  }

  const showNav = !NO_NAV.includes(cur);

  const SCREENS = {
    splash: <SplashScreen goTo={goTo} />,
    login: <LoginScreen goTo={goTo} setUser={setUser} />,
    onboarding: <OnboardingScreen goTo={goTo} showToast={showToast} back={back} />,
    home: <HomeScreen goTo={goTo} user={user} showToast={showToast} setSelectedJob={setSelectedJob} />,
    search: <ExploreScreen goTo={goTo} showToast={showToast} setSelectedJob={setSelectedJob} selectedJob={selectedJob} />,
    saved: <SavedScreen goTo={goTo} showToast={showToast} setSelectedJob={setSelectedJob} selectedJob={selectedJob} />,
    detail: <DetailScreen back={back} showToast={showToast} selectedJob={selectedJob} />,
    profile: <ProfileScreen goTo={goTo} user={user} showToast={showToast} setUser={setUser} back={back} />,
    notifications: <NotificationsScreen back={back} />,
  };

  const styleTag = (
    <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg:#141F14;--bg2:#1C2B1C;--bg3:#243024;--bg4:#2C3A2C;
          --card:rgba(28,43,28,0.95);--card2:rgba(36,48,36,0.9);
          --lime:#B8F023;--lime2:#CEFF4A;
          --lime-dim:rgba(184,240,35,0.12);--lime-mid:rgba(184,240,35,0.22);
          --text1:#F0F5E8;--text2:#8BA882;--text3:#556B52;
          --border:rgba(184,240,35,0.10);--border2:rgba(184,240,35,0.20);
          --radius-sm:8px;--radius-md:14px;--radius-lg:20px;--radius-xl:28px;--radius-full:999px;
          --tr:0.22s cubic-bezier(0.4,0,0.2,1);
        }
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        html,body{height:100%;background:#0D150D}
        body{font-family:'Inter',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}
        .phone{width:390px;height:844px;background:var(--bg);border-radius:46px;overflow:hidden;
          box-shadow:0 0 0 1px rgba(184,240,35,0.08),0 24px 80px rgba(0,0,0,0.7),0 0 60px rgba(184,240,35,0.04);
          position:relative;display:flex;flex-direction:column;user-select:none}
        @media(max-width:480px){.phone{width:100vw;height:100dvh;border-radius:0;box-shadow:none}}
        .status-bar{padding:14px 24px 6px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:var(--bg);z-index:20}
        .status-bar .time{font-size:15px;font-weight:700;color:var(--text1)}
        .status-icons{display:flex;gap:6px;align-items:center}
        .status-icons i{font-size:15px;color:var(--text2)}
        .screens{flex:1;overflow:hidden;position:relative;display:flex;flex-direction:column}
        .screen{position:absolute;top:0;left:0;right:0;bottom:0;overflow-y:auto;overflow-x:hidden;
          background:var(--bg);display:flex;flex-direction:column;scrollbar-width:none;
          transition:transform 0.32s cubic-bezier(0.4,0,0.2,1),opacity 0.32s ease}
        .screen::-webkit-scrollbar{display:none}
        .screen.inactive{transform:translateX(100%);pointer-events:none;z-index:1}
        .screen.out{transform:translateX(-28%);pointer-events:none;z-index:1}
        .screen.active{transform:translateX(0);opacity:1;z-index:10}
        .bnav{background:var(--bg2);border-top:1px solid var(--border);padding:10px 0 20px;
          display:flex;justify-content:space-around;flex-shrink:0;z-index:20}
        .nbtn{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;
          padding:4px 14px;border:none;background:none;transition:transform var(--tr);font-family:inherit}
        .nbtn:active{transform:scale(0.9)}
        .nbtn i{font-size:22px;color:var(--text3);transition:color var(--tr)}
        .nbtn.active i{color:var(--lime)}
        .ndot{width:4px;height:4px;border-radius:50%;background:var(--lime);opacity:0;transition:opacity var(--tr)}
        .nbtn.active .ndot{opacity:1}
        .nlbl{font-size:9px;font-weight:500;color:var(--text3);transition:color var(--tr)}
        .nbtn.active .nlbl{color:var(--lime)}
        .topbar{padding:10px 20px 8px;display:flex;align-items:center;justify-content:space-between;
          background:var(--bg);position:sticky;top:0;z-index:5;border-bottom:1px solid var(--border)}
        .logo{font-size:20px;font-weight:800;color:var(--text1);letter-spacing:-0.5px}
        .logo span{color:var(--lime)}
        .ibtn{width:36px;height:36px;border-radius:50%;border:1px solid var(--border2);background:var(--lime-dim);
          display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background var(--tr)}
        .ibtn:hover{background:var(--lime-mid)}
        .ibtn i{font-size:18px;color:var(--lime)}
        .ava{width:36px;height:36px;border-radius:50%;background:var(--lime);color:var(--bg);
          font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;
          cursor:pointer;border:2px solid rgba(184,240,35,0.3)}
        .splash{background:var(--bg);display:flex;flex-direction:column;justify-content:center;
          align-items:center;padding:40px 32px;text-align:center;min-height:100%}
        .splash-ring{width:180px;height:180px;border-radius:50%;border:1px solid var(--border2);
          display:flex;align-items:center;justify-content:center;margin-bottom:32px;
          background:var(--lime-dim);position:relative}
        .splash-ring::before{content:'';position:absolute;width:220px;height:220px;border-radius:50%;
          border:1px solid rgba(184,240,35,0.06);pointer-events:none}
        .splash-ring .inner{width:120px;height:120px;border-radius:50%;background:var(--lime-mid);
          display:flex;align-items:center;justify-content:center}
        .splash-ring i{font-size:52px;color:var(--lime)}
        .splash-title{font-size:28px;font-weight:800;color:var(--text1);line-height:1.2;margin-bottom:12px}
        .splash-title em{color:var(--lime);font-style:normal}
        .splash-sub{font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:40px}
        .splash-btn{width:100%;background:var(--lime);color:var(--bg);border:none;padding:16px;
          border-radius:var(--radius-full);font-size:15px;font-weight:800;cursor:pointer;
          font-family:inherit;transition:all var(--tr);margin-bottom:14px}
        .splash-btn:hover{background:var(--lime2)}
        .splash-btn:active{transform:scale(0.98)}
        .splash-skip{font-size:12px;color:var(--text3);cursor:pointer}
        .splash-skip:hover{color:var(--text2)}
        .hero-sec{padding:8px 20px 14px}
        .hero-greet{font-size:12px;color:var(--text2);margin-bottom:3px}
        .hero-h{font-size:24px;font-weight:800;color:var(--text1);line-height:1.2}
        .hero-h em{color:var(--lime);font-style:normal}
        .hero-sub{font-size:12px;color:var(--text2);margin-top:5px;line-height:1.5}
        .search-wrap{padding:0 20px 14px}
        .search-bar{display:flex;align-items:center;gap:10px;background:var(--bg2);
          border:1.5px solid var(--border);border-radius:var(--radius-full);padding:11px 16px;
          cursor:text;transition:border-color var(--tr)}
        .search-bar:hover{border-color:var(--border2)}
        .search-bar i{font-size:17px;color:var(--lime)}
        .search-bar span{font-size:13px;color:var(--text3);flex:1}
        .search-flt{width:28px;height:28px;background:var(--lime);border-radius:8px;display:flex;align-items:center;justify-content:center}
        .search-flt i{font-size:14px;color:var(--bg)}
        .stats-row{display:flex;gap:10px;padding:0 20px 16px}
        .stat-card{flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;text-align:center}
        .stat-num{font-size:18px;font-weight:800;color:var(--lime)}
        .stat-lbl{font-size:9px;color:var(--text2);margin-top:2px}
        .sec-hd{display:flex;justify-content:space-between;align-items:center;padding:0 20px 10px}
        .sec-title{font-size:14px;font-weight:700;color:var(--text1)}
        .see-all{font-size:11px;color:var(--lime);font-weight:500;cursor:pointer}
        .cats{display:flex;gap:8px;padding:0 20px 14px;overflow-x:auto;scrollbar-width:none}
        .cats::-webkit-scrollbar{display:none}
        .cat{padding:6px 14px;border-radius:var(--radius-full);font-size:11px;font-weight:600;
          white-space:nowrap;cursor:pointer;transition:all var(--tr);flex-shrink:0;border:1.5px solid transparent}
        .cat.active{background:var(--lime);color:var(--bg);border-color:var(--lime)}
        .cat.off{background:var(--bg2);color:var(--text2);border-color:var(--border)}
        .cat.off:hover{border-color:var(--border2);color:var(--text1)}
        .feat-card{margin:0 20px 14px;background:var(--bg2);border:1px solid var(--border2);
          border-radius:var(--radius-lg);padding:18px;cursor:pointer;
          transition:transform var(--tr),border-color var(--tr);overflow:hidden;position:relative}
        .feat-card::before{content:'';position:absolute;width:100px;height:100px;border-radius:50%;
          background:var(--lime-dim);top:-30px;right:-20px;pointer-events:none}
        .feat-card:hover{transform:translateY(-2px);border-color:var(--lime)}
        .fc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px}
        .fc-logo{width:44px;height:44px;border-radius:var(--radius-md);background:var(--lime-dim);
          border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;
          font-size:16px;font-weight:800;color:var(--lime)}
        .fc-badge{padding:4px 10px;border-radius:var(--radius-full);background:var(--lime-dim);
          color:var(--lime);font-size:10px;font-weight:600;border:1px solid var(--border2)}
        .fc-title{font-size:18px;font-weight:800;color:var(--text1);margin-bottom:2px}
        .fc-co{font-size:12px;color:var(--text2)}
        .fc-tags{display:flex;gap:6px;margin:10px 0;flex-wrap:wrap}
        .fc-tag{padding:4px 10px;border-radius:var(--radius-full);font-size:10px;font-weight:600;
          background:rgba(255,255,255,0.05);color:var(--text2);border:1px solid var(--border)}
        .fc-bot{display:flex;align-items:center;justify-content:space-between;margin-top:12px}
        .fc-salary{font-size:16px;font-weight:800;color:var(--lime)}
        .fc-apply{background:var(--lime);color:var(--bg);border:none;padding:8px 18px;
          border-radius:var(--radius-full);font-size:12px;font-weight:700;cursor:pointer;
          font-family:inherit;transition:all var(--tr)}
        .fc-apply:hover{background:var(--lime2)}
        .jcard{margin:0 20px 10px;background:var(--bg2);border:1px solid var(--border);
          border-radius:var(--radius-lg);padding:14px;cursor:pointer;transition:all var(--tr)}
        .jcard:hover{border-color:var(--border2);transform:translateY(-1px)}
        .jc-row{display:flex;align-items:center;gap:12px}
        .jc-logo{width:40px;height:40px;border-radius:var(--radius-md);flex-shrink:0;
          display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800}
        .jc-inf{flex:1;min-width:0}
        .jc-title{font-size:14px;font-weight:700;color:var(--text1)}
        .jc-meta{font-size:11px;color:var(--text2);margin-top:2px}
        .jsave{width:32px;height:32px;border-radius:var(--radius-sm);background:var(--lime-dim);
          border:1px solid var(--border2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--tr)}
        .jsave:hover,.jsave.saved{background:var(--lime)}
        .jsave:hover i,.jsave.saved i{color:var(--bg)}
        .jsave i{font-size:15px;color:var(--lime)}
        .jc-bot{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
        .tags-row{display:flex;gap:5px;flex-wrap:wrap}
        .jtag{padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600}
        .t-remote{background:var(--lime-dim);color:var(--lime);border:1px solid var(--border2)}
        .t-full{background:rgba(34,197,94,0.1);color:#4ADE80}
        .t-hybrid{background:rgba(251,191,36,0.1);color:#FCD34D}
        .t-onsite{background:rgba(96,165,250,0.1);color:#93C5FD}
        .jc-salary{font-size:12px;font-weight:700;color:var(--lime)}
        .sp{height:16px;flex-shrink:0}
        .det-screen{background:var(--bg)}
        .det-topbar{padding:10px 20px 8px;display:flex;align-items:center;justify-content:space-between;
          background:var(--bg);position:sticky;top:0;z-index:5;border-bottom:1px solid var(--border)}
        .bk-btn{width:36px;height:36px;border-radius:50%;background:var(--bg2);border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all var(--tr)}
        .bk-btn:hover{border-color:var(--border2)}
        .bk-btn i{font-size:18px;color:var(--text1)}
        .det-hero{padding:10px 20px 18px;text-align:center}
        .det-logo{width:64px;height:64px;border-radius:18px;margin:0 auto 12px;background:var(--lime-dim);
          border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;
          font-size:22px;font-weight:800;color:var(--lime)}
        .det-title{font-size:22px;font-weight:800;color:var(--text1);margin-bottom:4px}
        .det-co{font-size:12px;color:var(--text2)}
        .det-stats{display:flex;margin:0 20px 16px;background:var(--bg2);
          border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden}
        .dsi{flex:1;padding:12px 0;text-align:center;position:relative}
        .dsi:not(:last-child)::after{content:'';position:absolute;right:0;top:15%;height:70%;width:1px;background:var(--border)}
        .dsv{font-size:13px;font-weight:700;color:var(--lime)}
        .dsl{font-size:10px;color:var(--text3);margin-top:2px}
        .det-body{background:var(--bg);border-radius:24px 24px 0 0;flex:1;padding:20px 20px 0}
        .dtabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:16px}
        .dtab{flex:1;padding:10px 0;text-align:center;font-size:12px;font-weight:600;color:var(--text3);
          cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all var(--tr)}
        .dtab.active{color:var(--lime);border-bottom-color:var(--lime)}
        .about-txt{font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:14px}
        .ds-title{font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px}
        .req-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
        .rtag{padding:5px 12px;border-radius:var(--radius-full);background:var(--lime-dim);
          color:var(--lime);font-size:11px;font-weight:600;border:1px solid var(--border2)}
        .ben-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
        .ben-ico{width:32px;height:32px;border-radius:var(--radius-sm);background:var(--lime-dim);
          border:1px solid var(--border2);display:flex;align-items:center;justify-content:center}
        .ben-ico i{font-size:15px;color:var(--lime)}
        .ben-txt{font-size:12px;color:var(--text2)}
        .apply-bar{padding:14px 20px 18px;background:var(--bg);border-top:1px solid var(--border);
          display:flex;gap:12px;align-items:center;flex-shrink:0}
        .sal-disp .sal-amt{font-size:18px;font-weight:800;color:var(--lime)}
        .sal-disp .sal-per{font-size:10px;color:var(--text3)}
        .apply-btn-full{flex:1.5;background:var(--lime);color:var(--bg);border:none;padding:13px 0;
          border-radius:var(--radius-full);font-size:14px;font-weight:800;cursor:pointer;
          font-family:inherit;transition:all var(--tr)}
        .apply-btn-full:hover{background:var(--lime2)}
        .srch-inp-wrap{padding:10px 20px 14px}
        .srch-inp{display:flex;gap:10px;align-items:center;background:var(--bg2);
          border:1.5px solid var(--lime);border-radius:var(--radius-full);padding:11px 16px;
          box-shadow:0 0 0 4px rgba(184,240,35,0.06)}
        .srch-inp i{font-size:17px;color:var(--lime)}
        .f-sec{padding:0 20px 12px}
        .f-lbl{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;
          letter-spacing:0.5px;margin-bottom:8px}
        .f-chips{display:flex;gap:6px;flex-wrap:wrap}
        .fchip{padding:6px 14px;border-radius:var(--radius-full);font-size:11px;font-weight:600;
          border:1.5px solid var(--border);color:var(--text2);background:var(--bg2);cursor:pointer;transition:all var(--tr)}
        .fchip.active{background:var(--lime);color:var(--bg);border-color:var(--lime)}
        .fchip:hover:not(.active){border-color:var(--border2);color:var(--text1)}
        .pop-srch{padding:4px 20px 14px}
        .pop-title{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px}
        .pop-tags{display:flex;gap:6px;flex-wrap:wrap}
        .ptag{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:var(--radius-md);
          background:var(--bg2);border:1px solid var(--border);font-size:11px;color:var(--text2);
          cursor:pointer;transition:all var(--tr)}
        .ptag:hover{background:var(--lime-dim);color:var(--lime);border-color:var(--border2)}
        .ptag i{font-size:12px;color:var(--text3)}
        .res-count{padding:0 20px 10px;font-size:12px;color:var(--text2)}
        .res-count strong{color:var(--lime)}
        .divl{height:1px;background:var(--border);margin:0 20px 14px}
        .saved-filters{padding:4px 20px 12px;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
        .saved-filters::-webkit-scrollbar{display:none}
        .schip{padding:6px 14px;border-radius:var(--radius-full);font-size:11px;font-weight:600;
          white-space:nowrap;border:1.5px solid var(--border);color:var(--text2);
          background:var(--bg2);cursor:pointer;transition:all var(--tr);flex-shrink:0}
        .schip.active{background:var(--lime);color:var(--bg);border-color:var(--lime)}
        .si{margin:0 20px 10px;background:var(--bg2);border:1px solid var(--border);
          border-radius:var(--radius-lg);padding:14px;display:flex;align-items:center;gap:12px;
          cursor:pointer;transition:all var(--tr)}
        .si:hover{border-color:var(--border2);transform:translateY(-1px)}
        .si-logo{width:40px;height:40px;border-radius:var(--radius-md);flex-shrink:0;
          display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800}
        .si-inf{flex:1;min-width:0}
        .si-t{font-size:13px;font-weight:700;color:var(--text1)}
        .si-s{font-size:11px;color:var(--text2);margin-top:2px}
        .si-sal{font-size:10px;font-weight:600;color:var(--lime);margin-top:3px}
        .si-bdg{padding:4px 10px;border-radius:var(--radius-full);font-size:10px;font-weight:700;flex-shrink:0}
        .b-new{background:rgba(96,165,250,0.12);color:#93C5FD}
        .b-app{background:rgba(251,191,36,0.12);color:#FCD34D}
        .b-int{background:rgba(34,197,94,0.12);color:#4ADE80}
        .b-clo{background:rgba(248,113,113,0.12);color:#FCA5A5}
        .prof-hero{background:var(--bg2);border-bottom:1px solid var(--border);padding:10px 20px 22px;text-align:center}
        .prof-ava{width:72px;height:72px;border-radius:50%;background:var(--lime);margin:0 auto 10px;
          display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;
          color:var(--bg);border:3px solid rgba(184,240,35,0.25)}
        .prof-name{font-size:19px;font-weight:800;color:var(--text1)}
        .prof-role{font-size:12px;color:var(--text2);margin-top:3px}
        .prof-loc{font-size:11px;color:var(--text3);margin-top:3px;display:flex;align-items:center;justify-content:center;gap:4px}
        .prof-loc i{font-size:12px}
        .prof-stats{display:flex;margin-top:18px;background:var(--bg3);border-radius:var(--radius-md);border:1px solid var(--border)}
        .ps{flex:1;padding:12px 0;text-align:center;position:relative}
        .ps:not(:last-child)::after{content:'';position:absolute;right:0;top:15%;height:70%;width:1px;background:var(--border)}
        .psv{font-size:17px;font-weight:800;color:var(--lime)}
        .psl{font-size:9px;color:var(--text3);margin-top:2px}
        .prof-body{background:var(--bg);flex:1;padding:0}
        .menu-sec-lbl{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;padding:16px 20px 8px}
        .mi{display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid var(--border);cursor:pointer;transition:background var(--tr)}
        .mi:hover{background:var(--bg2)}
        .mi-ico{width:36px;height:36px;border-radius:var(--radius-md);background:var(--lime-dim);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center}
        .mi-ico i{font-size:17px;color:var(--lime)}
        .mi-txt{flex:1}
        .mi-lbl{font-size:13px;font-weight:600;color:var(--text1)}
        .mi-sub{font-size:11px;color:var(--text3);margin-top:1px}
        .mi-arr{font-size:15px;color:var(--text3);margin-left:auto}
        .mi-bdg{padding:2px 8px;border-radius:var(--radius-full);background:var(--lime);color:var(--bg);font-size:10px;font-weight:800}
        .mi-ico.red{background:rgba(248,113,113,0.1);border-color:rgba(248,113,113,0.15)}
        .mi-ico.red i{color:#F87171}
        .notif{display:flex;gap:12px;padding:14px 20px;border-bottom:1px solid var(--border);cursor:pointer;transition:background var(--tr)}
        .notif:hover{background:var(--bg2)}
        .notif.unread{background:var(--lime-dim)}
        .notif-ico{width:40px;height:40px;border-radius:var(--radius-md);flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .notif-ico i{font-size:18px;color:var(--lime)}
        .notif-txt{flex:1}
        .notif-t{font-size:13px;font-weight:600;color:var(--text1);margin-bottom:2px}
        .notif-s{font-size:11px;color:var(--text2);line-height:1.4}
        .notif-time{font-size:10px;color:var(--text3);margin-top:4px}
        .toast-el{position:absolute;bottom:90px;left:20px;right:20px;background:var(--bg2);
          border:1px solid var(--border2);color:var(--text1);border-radius:var(--radius-md);
          padding:12px 16px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px;
          transform:translateY(20px);opacity:0;transition:all 0.3s ease;pointer-events:none;z-index:200}
        .toast-el.show{transform:translateY(0);opacity:1}
        .toast-el i{font-size:16px;color:var(--lime)}
        input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:var(--bg3);outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--lime);cursor:pointer}
      `}} />
  );

  if (!mounted) {
    return (
      <div style={{ background: '#0D150D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="ti ti-loader" style={{ fontSize: 32, color: 'var(--lime)', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Show full-screen loader while processing OAuth redirect
  if (authLoading) {
    return (
      <div style={{ background: '#0D150D', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, background: 'rgba(184,240,35,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-loader" style={{ fontSize: 28, color: '#B8F023', animation: 'spin 1s linear infinite' }} />
        </div>
        <div style={{ color: '#8BA882', fontSize: 14, fontWeight: 500 }}>Signing you in…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }



  return (
    <>
      {styleTag}
      <div className="phone">
        {/* Status bar */}
        <div className="status-bar">
          <span className="time">{time}</span>
          <div className="status-icons">
            <i className="ti ti-wifi" /><i className="ti ti-signal-4g" /><i className="ti ti-battery" />
          </div>
        </div>

        {/* Screens */}
        <div className="screens">
          {Object.entries(SCREENS).map(([name, component]) => {
            const isActive = name === cur;
            const isPrev = name === prev;
            let cls = 'screen inactive';
            if (isActive) cls = 'screen active';
            else if (isPrev) cls = 'screen out';
            return (
              <div key={name} className={cls}>
                {(isActive || isPrev) ? component : null}
              </div>
            );
          })}
        </div>

        {/* Bottom navigation */}
        {showNav && (
          <div className="bnav">
            {[
              { id: 'home', icon: 'ti-home', label: 'Home' },
              { id: 'search', icon: 'ti-search', label: 'Explore' },
              { id: 'saved', icon: 'ti-bookmark', label: 'Saved' },
              { id: 'profile', icon: 'ti-user', label: 'Profile' },
            ].map(({ id, icon, label }) => (
              <button key={id} className={`nbtn ${cur === id ? 'active' : ''}`} onClick={() => goTo(id)}>
                <i className={`ti ${icon}`} />
                <div className="ndot" />
                <span className="nlbl">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Toast */}
        <div className={`toast-el ${toast.show ? 'show' : ''}`}>
          <i className="ti ti-check" />
          <span>{toast.msg}</span>
        </div>
      </div>
    </>
  );
}
