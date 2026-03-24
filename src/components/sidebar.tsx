"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Briefcase,
  Settings, LogOut, ChevronLeft, ChevronRight, Loader2, Link2
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Workspace', icon: Briefcase, href: '/workspace' },
  { name: 'Connections', icon: Link2, href: '/connections' },
  { name: 'Scheduler', icon: Calendar, href: '/scheduler' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

const BASE_URL = "http://135.181.242.234:7860";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Helper: Get Token from cookies (standard for your setup)
  const getAuthToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; accessToken=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return "";
  };

  // 1. FETCH CURRENT USER DATA (GET /auth/me)
  useEffect(() => {
    const fetchUser = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Sidebar user fetch failed", err);
      }
    };
    fetchUser();
  }, []);

  // 2. LOGOUT IMPLEMENTATION (POST /auth/logout)
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const token = getAuthToken();

      // Call the backend to invalidate the session
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      // CLEAN UP: Remove cookies and local storage
      document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      localStorage.removeItem('accessToken');

      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside
        className={`h-screen flex flex-col flex-shrink-0 transition-all duration-300 relative ${isCollapsed ? 'w-[88px]' : 'w-[288px]'}`}
        style={{
          backgroundColor: 'var(--secondary)',
          borderRight: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

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
                <div className="w-10 h-10 rounded-full overflow-hidden border border-text-secondary/10">
                    <img 
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}&background=833cf6&color=fff`} 
                        alt="User" 
                        className="w-full h-full object-cover" 
                    />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              )}
              {!isCollapsed && user && (
                <div className="overflow-hidden whitespace-nowrap animate-in fade-in">
                  <h4 className="text-sm font-bold text-text-primary truncate">{user.firstName} {user.lastName}</h4>
                  <p className="text-[11px] text-text-secondary truncate">{user.email}</p>
                </div>
              )}
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`text-text-secondary hover:text-red-500 transition-colors ${isCollapsed ? 'bg-background rounded-xl w-10 h-10 flex items-center justify-center border border-text-secondary/10' : 'p-2'}`}
            >
              {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}