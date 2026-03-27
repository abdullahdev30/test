"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield } from 'lucide-react';
import { Card } from '@/components/common';

const navLinks = [
  { label: "Profile", href: "/settings/profile", icon: User },
  { label: "Security", href: "/settings/security", icon: Shield },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="w-full p-6 lg:p-10 font-sans">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-text-primary tracking-tight">Account Settings</h1>
        <p className="text-text-secondary mt-2 text-base">Manage your orchestrator profile and digital identity.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Nav */}
        <div className="w-full md:w-72 flex-shrink-0">
          <Card className="space-y-3 p-4 rounded-2xl shadow-sm border-text-secondary/15">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all border ${isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 border-primary'
                      : 'text-text-secondary border-text-secondary/15 hover:bg-text-primary/5 hover:text-text-primary'
                    }`}
                >
                  <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-white/10' : 'bg-secondary'
                  }`}>
                    <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}
