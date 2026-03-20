"use client";
import React from 'react';
import { 
  Plus, Sparkles, Clock, CheckCircle2, 
  MessageSquare, Layout, Link2, Zap, 
  PenTool, Palette, MoreHorizontal, RefreshCw 
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen font-sans">
      
      {/* --- TOP HEADER SECTION --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Overview</h1>
          <p className="text-text-secondary mt-2 font-medium">Welcome back, here's what's happening with your socials.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3.5 border-2 border-text-primary/10 bg-bg-primary rounded-2xl font-bold text-text-primary hover:bg-text-primary/5 transition-all text-sm shadow-sm">
            <Plus size={20} /> Create Post
          </button>
          <button className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all text-sm">
            <Sparkles size={20} /> Generate AI Content
          </button>
        </div>
      </div>

      {/* --- 4-COLUMN STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <StatBox icon={<Clock className="text-blue-500" />} label="Scheduled" value="24" trend="+12%" color="blue" />
        <StatBox icon={<CheckCircle2 className="text-emerald-500" />} label="Published" value="142" trend="+4%" color="emerald" />
        <StatBox icon={<MessageSquare className="text-orange-400" />} label="Pending Approval" value="5" trend="0%" color="orange" />
        <StatBox icon={<Layout className="text-primary" />} label="Accounts" value="8" trend="-2%" color="purple" />
      </div>

      {/* --- BOTTOM SECTION: 2/3 and 1/3 SPLIT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Upcoming Posts */}
        <div className="lg:col-span-8">
          <div className="bg-bg-primary border border-text-primary/10 rounded-[32px] p-8 shadow-sm h-full transition-colors duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-text-primary">Upcoming Posts</h3>
              <button className="text-sm font-bold text-primary hover:opacity-70 transition-opacity">View Calendar</button>
            </div>
            <div className="space-y-4">
              <PostItem platform="TWITTER" time="Today, 2:30 PM" title="10 AI tools that will change your marketing workflow" tagClass="bg-blue-500/10 text-blue-500" />
              <PostItem platform="INSTAGRAM" time="Tomorrow, 10:00 AM" title="Behind the scenes: How we use SocialAI for growth" tagClass="bg-pink-500/10 text-pink-500" />
              <PostItem platform="LINKEDIN" time="Nov 14, 09:15 AM" title="Why automation is the future of small business" tagClass="bg-indigo-500/10 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Right Side: Quick Actions & Activity */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-bg-primary border border-text-primary/10 rounded-[32px] p-8 shadow-sm transition-colors duration-300">
            <h3 className="text-xl font-bold text-text-primary mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <QuickAction icon={<Link2 />} label="Connect Account" />
              <QuickAction icon={<Zap />} label="Bulk Generate" />
              <QuickAction icon={<PenTool />} label="Draft Post" />
              <QuickAction icon={<Palette />} label="AI Designer" />
            </div>
          </div>

          <div className="bg-bg-primary border border-text-primary/10 rounded-[32px] p-8 shadow-sm transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text-primary">Activity Log</h3>
              <button className="text-xs text-text-secondary font-bold hover:text-primary transition-colors">View all</button>
            </div>
            <div className="space-y-6 relative ml-2">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-text-primary/10"></div>
              <LogItem icon={<CheckCircle2 size={14} />} color="emerald" title="Post published successfully" time="Twitter - 12 mins ago" />
              <LogItem icon={<Sparkles size={14} />} color="purple" title="AI generated 4 drafts" time="System - 2 hours ago" />
              <LogItem icon={<Link2 size={14} />} color="blue" title="Connected TikTok account" time="Nov 11, 4:50 PM" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- HELPER SUB-COMPONENTS --- */

function StatBox({ icon, label, value, trend, color }: any) {
  const bgs: any = { 
    blue: "bg-blue-500/10", 
    emerald: "bg-emerald-500/10", 
    orange: "bg-orange-500/10", 
    purple: "bg-primary/10" 
  };
  return (
    <div className="bg-bg-primary p-7 rounded-[32px] border border-text-primary/10 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgs[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg tracking-tight">{trend}</span>
      </div>
      <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{label}</p>
      <h3 className="text-3xl font-black text-text-primary mt-1">{value}</h3>
    </div>
  );
}

function PostItem({ platform, time, title, tagClass }: any) {
  return (
    <div className="flex items-center gap-5 p-4 rounded-2xl border border-text-primary/5 hover:bg-text-primary/5 transition-all cursor-pointer group">
      <div className="w-16 h-16 bg-text-primary/5 rounded-2xl overflow-hidden flex-shrink-0 border border-text-primary/10"></div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${tagClass}`}>{platform}</span>
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{time}</span>
        </div>
        <h4 className="text-[15px] font-bold text-text-primary group-hover:text-primary transition-colors">{title}</h4>
      </div>
      <div className="flex flex-col justify-between items-end h-16">
        <MoreHorizontal className="text-text-secondary/50 group-hover:text-text-primary transition-colors" size={20} />
        <RefreshCw className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
      </div>
    </div>
  );
}

function QuickAction({ icon, label }: any) {
  return (
    <button className="flex flex-col items-center justify-center p-5 rounded-[24px] border border-text-primary/5 bg-bg-primary hover:border-primary/30 hover:bg-primary/5 transition-all group">
      <div className="text-primary mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[10px] font-bold text-text-primary leading-tight uppercase tracking-tight text-center">{label}</span>
    </button>
  );
}

function LogItem({ icon, color, title, time }: any) {
  const colors: any = { 
    emerald: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10", 
    purple: "text-primary border-primary/20 bg-primary/10", 
    blue: "text-blue-500 border-blue-500/20 bg-blue-500/10" 
  };
  return (
    <div className="flex gap-4 relative z-10">
      <div className={`w-6 h-6 rounded-full border flex items-center justify-center shadow-sm ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <h5 className="text-[13px] font-bold text-text-primary">{title}</h5>
        <p className="text-[11px] text-text-secondary font-medium mt-0.5">{time}</p>
      </div>
    </div>
  );
}