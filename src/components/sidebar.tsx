"use client";
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Briefcase,
  Settings, LogOut, ChevronLeft, ChevronRight, Link2, FileText
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { logout } from '@/lib/api/auth';
import { Button, Spinner } from './common';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Workspace', icon: Briefcase, href: '/workspace' },
  { name: 'Connections', icon: Link2, href: '/connections' },
  { name: 'Automation', icon: FileText, href: '/posts' },
  { name: 'Scheduler', icon: Calendar, href: '/scheduler' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      window.location.href = '/login';
    });
  };

  return (
    <div className="flex h-screen w-full overflow-visible bg-bg-primary">
      <aside
        className={`h-screen flex flex-col bg-bg-primary flex-shrink-0 transition-all duration-300 relative ${isCollapsed ? 'w-[88px]' : 'w-[288px]'}`}
        style={{
        
          borderRight: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          size='icon'
          className="absolute -right-4 top-20  rounded-full shadow-md hover:scale-110 transition-transform z-0 p-0"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>

        <div className={`flex flex-col h-full ${isCollapsed ? 'p-4 items-center' : 'p-6'}`}>
          <Link href="/dashboard" className={`flex items-center gap-3 mb-10 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" /></svg>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
                <h2 className="font-bold leading-tight" style={{ fontSize: '1.25rem', color: 'var(--txt-primary)' }}>SocialAI</h2>
                <p style={{ fontSize: '0.875em' }} className="text-text-secondary">Pro Workspace</p>
              </div>
            )}
          </Link>

          <nav className="flex-1 space-y-2 w-full">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-2xl transition-all duration-200 group ${isActive
                    ? 'bg-[#F3E8FF] text-primary font-semibold'
                    : 'text-text-secondary hover:bg-text-secondary/5'
                    } ${isCollapsed ? 'justify-center p-3 w-14 h-14 mx-auto' : 'gap-4 px-4 py-3'}`}
                >
                  <item.icon size={22} className={isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'} />
                  {!isCollapsed && <span className="text-[15px] whitespace-nowrap">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Footer */}
          <div className={`flex w-full pt-6 border-t border-text-secondary/10 mt-auto ${isCollapsed ? 'justify-center flex-col gap-4 items-center' : 'items-center justify-between'}`}>
            <Link href="/settings" className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${isCollapsed ? 'justify-center' : ''}`}>
              {user ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-text-secondary/10 flex-shrink-0">
                  <img
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent((user.firstName as string) || 'U')}&background=833cf6&color=fff`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
              )}
              {!isCollapsed && user && (
                <div className="overflow-hidden whitespace-nowrap animate-in fade-in">
                  <h4 className="text-sm font-bold text-text-primary truncate">{user.firstName as string} {user.lastName as string}</h4>
                  <p className="text-[11px] text-text-secondary truncate">{user.email as string}</p>
                </div>
              )}
            </Link>
            <Button
              onClick={handleLogout}
              disabled={isPending}
              variant={isCollapsed ? 'outline' : 'ghost'}
              size="icon"
              className={`text-text-secondary hover:text-red-500 ${isCollapsed ? 'bg-background rounded-xl w-10 h-10 border border-text-secondary/10' : ''}`}
            >
              {isPending ? <Spinner size="md" /> : <LogOut size={20} />}
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
