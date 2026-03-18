"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Settings, Menu, X, Sparkles } from "lucide-react";
import ThemeToggle from "./theme_provider";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Schedules", path: "/schedules" },
    { name: "Analytics", path: "/analytics" },
    { name: "AI Lab", path: "/ai-lab" },
  ];

  return (
    <nav className="bg-bg-primary border-b relative">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <span className="font-semibold text-xl">Social AI</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center ml-10 space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;

            return (
              <Link
                key={link.name}
                href={link.path}
                className={`text-sm font-medium transition-all pb-1 ${
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-txt-primary hover:text-primary/80"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right Section */}
        <div className="flex items-center flex-1 justify-end gap-3 md:gap-4">
          
          {/* Search */}
          <div className="hidden sm:relative sm:block w-full max-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary" size={16} />
            <input
              type="text"
              placeholder="Command Search..."
              className="w-full bg-background rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <ThemeToggle />

          <button className="p-2 hover:bg-bg-secondary rounded-full">
            <Bell size={20} />
          </button>

          <button className="p-2 hover:bg-bg-secondary rounded-full">
            <Settings size={20} />
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border cursor-pointer">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="User"
            />
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-bg-primary z-50 shadow-2xl transform transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary" size={24} />
              <span className="font-bold text-xl">SocialAI</span>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;

              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium px-4 py-2 rounded-lg transition ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-txt-primary hover:bg-bg-secondary"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile Search */}
          <div className="mt-auto pt-6 border-t">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary" size={16} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-background rounded-lg py-2 pl-10 pr-4 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;