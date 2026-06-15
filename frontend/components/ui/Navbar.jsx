'use client';
// components/ui/Navbar.jsx
import { Bell, Search, Zap } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ title, user }) {
  const [hasNotifications] = useState(true);

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center px-6 gap-4 shrink-0">
      {/* Page title */}
      <h1 className="text-lg font-semibold text-text flex-1">{title}</h1>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
        <input
          type="text"
          placeholder="Search jobs, companies..."
          className="input pl-9 w-64 py-2 text-sm"
        />
      </div>

      {/* Notifications */}
      <button
        id="notifications-btn"
        className="relative p-2 rounded-lg hover:bg-card transition-colors text-text-muted hover:text-text"
      >
        <Bell className="w-5 h-5" />
        {hasNotifications && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        )}
      </button>

      {/* User avatar */}
      {user && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm border border-primary/30">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      )}
    </header>
  );
}
