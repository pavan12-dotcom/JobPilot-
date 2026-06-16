'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PhoneShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [time, setTime] = useState('9:41');

  // Update clock time in the status bar
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Determine navigation state
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  
  // Routes where the bottom nav is visible
  const mainTabs = [
    '/dashboard',
    '/dashboard/jobs',
    '/dashboard/applications',
    '/dashboard/settings'
  ];
  const showBottomNav = isDashboardRoute && mainTabs.includes(pathname);

  // Sub-routes of dashboard that show a "Back" button instead of the full logo header
  const isSubScreen = isDashboardRoute && !mainTabs.includes(pathname);
  
  // Mapping current path to tab IDs
  let activeTab = 'home';
  if (pathname === '/dashboard/jobs') activeTab = 'search';
  else if (pathname === '/dashboard/applications') activeTab = 'saved';
  else if (pathname === '/dashboard/settings') activeTab = 'profile';

  function handleBack() {
    if (pathname === '/dashboard/resume' || pathname === '/dashboard/ab-testing') {
      router.push('/dashboard/settings');
    } else {
      router.back();
    }
  }

  // Header Title for sub-screens
  let subHeaderTitle = 'Job Details';
  if (pathname === '/dashboard/resume') subHeaderTitle = 'Resume Manager';
  else if (pathname === '/dashboard/ab-testing') subHeaderTitle = 'Resume A/B Testing';
  else if (pathname === '/onboarding') subHeaderTitle = 'Preferences';

  return (
    <div className="phone">
      {/* 1. STATUS BAR */}
      <div className="status-bar" id="sb">
        <span className="time">{time}</span>
        <div className="status-icons">
          <i className="ti ti-wifi"></i>
          <i className="ti ti-signal-4g"></i>
          <i className="ti ti-battery"></i>
        </div>
      </div>

      {/* 2. SCREENS CANVAS */}
      <div className="screens">
        
        {/* Dynamic header: Logo Topbar for main tabs */}
        {showBottomNav && (
          <div className="topbar">
            <div className="logo" onClick={() => router.push('/dashboard')}>
              Job<span>Pilot</span>
            </div>
            <div className="flex gap-2.5">
              <button 
                onClick={() => router.push('/dashboard/settings')} 
                className="ava"
              >
                AR
              </button>
            </div>
          </div>
        )}

        {/* Dynamic header: Sub-screen Back header */}
        {isSubScreen && (
          <div className="topbar">
            <button className="bk-btn" onClick={handleBack}>
              <i className="ti ti-arrow-left"></i>
            </button>
            <span className="text-sm font-bold text-text">{subHeaderTitle}</span>
            <div className="w-9 h-9" /> {/* Spacer */}
          </div>
        )}

        {/* Content Section */}
        <div className="screen-content">
          {children}
        </div>
      </div>

      {/* 3. BOTTOM NAVIGATION */}
      {showBottomNav && (
        <div className="bnav" id="bnav">
          <button 
            onClick={() => router.push('/dashboard')} 
            className={`nbtn ${activeTab === 'home' ? 'active' : ''}`}
          >
            <i className="ti ti-home"></i>
            <div className="ndot"></div>
            <span className="nlbl">Home</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/jobs')} 
            className={`nbtn ${activeTab === 'search' ? 'active' : ''}`}
          >
            <i className="ti ti-search"></i>
            <div className="ndot"></div>
            <span className="nlbl">Explore</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/applications')} 
            className={`nbtn ${activeTab === 'saved' ? 'active' : ''}`}
          >
            <i className="ti ti-bookmark"></i>
            <div className="ndot"></div>
            <span className="nlbl">Saved</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/settings')} 
            className={`nbtn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <i className="ti ti-user"></i>
            <div className="ndot"></div>
            <span className="nlbl">Profile</span>
          </button>
        </div>
      )}
    </div>
  );
}
