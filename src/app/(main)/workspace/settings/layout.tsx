"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserCircle, Key, Users } from 'lucide-react';
import { Card } from '@/components/common';

export default function WorkspaceSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { title: "Business Profile", href: "/workspace/settings/profile", icon: UserCircle },
    { title: "Keywords", href: "/workspace/settings/keywords", icon: Key },
    { title: "Team", href: "/workspace/settings/team", icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-text-primary tracking-tight">Workspace Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your business profile, keywords, and team access.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Sidebar */}
        <Card className="w-full md:w-64 flex-shrink-0 space-y-1 p-2 rounded-lg">
          {links.map((item) => {
            const isActive = pathname === item.href;
            return (
               <Link
                 key={item.title}
                 href={item.href}
                 className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                   isActive 
                   ? 'bg-primary/10 text-primary font-semibold' 
                   : 'text-text-secondary hover:bg-text-secondary/5 hover:text-text-primary'
                 }`}
               >
                 <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                 {item.title}
               </Link>
            )
          })}
        </Card>

        {/* Main Setting Content Area */}
        <Card className="flex-1 rounded-lg shadow-sm min-h-[500px]">
          {children}
        </Card>
      </div>
    </div>
  );
}
