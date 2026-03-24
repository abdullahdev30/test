"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Factory } from 'lucide-react';

const navLinks = [
  { label: "Profile", href: "/settings/profile", icon: User },
  { label: "Security", href: "/settings/security", icon: Shield },
  { label: "General", href: "/settings/general", icon: Factory },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 font-sans">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-text-primary tracking-tight">Settings</h1>
        <p className="text-text-secondary mt-2 font-bold uppercase text-[11px] tracking-[0.2em]">Account Management</p>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Left Nav */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-2 bg-bg-primary border border-text-secondary/10 p-3 rounded-[32px] shadow-sm">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-text-secondary hover:bg-text-primary/5 hover:text-text-primary'
                  }`}
                >
                  <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}
