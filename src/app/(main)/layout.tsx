"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-background transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
