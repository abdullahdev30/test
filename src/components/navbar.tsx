"use client";
import React, { useState } from "react";
import { Search, Bell, Settings, Menu, X, Sparkles } from "lucide-react";
import ThemeToggle from "./theme_provider";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);


  return (
    <nav 
      className="relative z-50 backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        padding: '0 calc(1rem * 1.5)'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between" style={{ height: 'calc(1rem * 4)' }}>
        
       



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

          <button className="p-2 hover:bg-secondary rounded-full">
            <Bell size={20} />
          </button>

          <button className="p-2 hover:bg-secondary rounded-full">
            <Settings size={20} />
          </button>



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