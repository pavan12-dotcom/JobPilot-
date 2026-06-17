'use client';
// components/ui/Sidebar.jsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap, LayoutDashboard, Briefcase, FileText,
  ClipboardList, Calendar, Settings, LogOut, Bot, GitCompare
} from 'lucide-react';
import { signOut } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/dashboard/resume', label: 'Resume', icon: FileText },
  { href: '/dashboard/ab-testing', label: 'A/B Testing', icon: GitCompare },
  { href: '/dashboard/applications', label: 'Applications', icon: ClipboardList },
  { href: '/dashboard/schedules', label: 'Schedules', icon: Calendar },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <aside className="w-60 min-h-screen bg-surface border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text">JobPilot</span>
        </Link>
      </div>

      {/* AI Status Badge */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg px-3 py-2">
          <Bot className="w-4 h-4 text-success" />
          <div>
            <p className="text-xs font-semibold text-success">AI Active</p>
            <p className="text-[11px] text-text-subtle">Auto-applying enabled</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(isActive ? 'nav-item-active' : 'nav-item')}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        {user && (
          <div className="flex items-center gap-3 p-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{user.name}</p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted
                     hover:text-error hover:bg-error/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
