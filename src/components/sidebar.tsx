"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Calendar, BarChart3, 
  Archive, Link2, Settings, LogOut 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Scheduler', icon: Calendar, href: '/scheduler' },
  { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  { name: 'Content Library', icon: Archive, href: '/content-library' },
  { name: 'Connections', icon: Link2, href: '/connections' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

// Added children prop to make it a wrapper
export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FDFCFE]">
      {/* Sidebar - Fixed Width */}
      <aside className="w-72 h-screen bg-white border-r border-gray-100 flex flex-col p-6 flex-shrink-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">SocialAI</h2>
            <p className="text-xs text-gray-400">Pro Workspace</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  isActive 
                  ? 'bg-[#F3E8FF] text-primary font-semibold' 
                  : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <item.icon size={22} className={isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'} />
                <span className="text-[15px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* AI Usage Card */}
        <div className="bg-[#FAF8FF] border border-purple-50 rounded-3xl p-5 mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[13px] font-bold text-primary">AI Usage</span>
            <span className="text-[11px] font-medium text-gray-400">65%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mb-3">
            <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
          </div>
          <p className="text-[11px] text-gray-400 mb-4">6,500 / 10,000 tokens</p>
          <button className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90">
            Upgrade Plan
          </button>
        </div>

        {/* User Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-200 rounded-full flex-shrink-0"></div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-gray-900 truncate">Alex Rivers</h4>
              <p className="text-[11px] text-gray-400 truncate">alex@socialai.com</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Render Area */}
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}