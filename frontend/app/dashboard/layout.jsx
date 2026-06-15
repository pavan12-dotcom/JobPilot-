'use client';
// app/dashboard/layout.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Navbar from '@/components/ui/Navbar';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/jobs': 'Job Recommendations',
  '/dashboard/resume': 'My Resume',
  '/dashboard/applications': 'Applications',
  '/dashboard/schedules': 'Auto-Apply Schedules',
  '/dashboard/settings': 'Settings',
};

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pathname, setPathname] = useState('/dashboard');

  useEffect(() => {
    const token = localStorage.getItem('applyai_token');
    const userData = localStorage.getItem('applyai_user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {}
    }

    setPathname(window.location.pathname);
  }, []);

  const title = PAGE_TITLES[pathname] || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar title={title} user={user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
