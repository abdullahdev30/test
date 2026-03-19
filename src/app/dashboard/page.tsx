"use client";
import React from 'react';
import Sidebar from '@/components/sidebar';
import { 
  Plus, Sparkles, Clock, CheckCircle2, 
  MessageSquare, Layout, Link2, Zap, 
  PenTool, Palette, MoreHorizontal, RefreshCw 
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <Sidebar>
      <div className="p-8 max-w-[1600px] mx-auto bg-[#FDFCFE] min-h-screen font-sans">
        
        {/* --- TOP HEADER SECTION --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Overview</h1>
            <p className="text-gray-400 mt-2 font-bold">Welcome back, here's what's happening with your socials.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3.5 border-2 border-gray-100 rounded-2xl font-black text-gray-700 hover:bg-gray-50 transition-all text-sm">
              <Plus size={20} /> Create Post
            </button>
            <button className="flex items-center gap-2 px-6 py-3.5 bg-[#7C3AED] text-white rounded-2xl font-black shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all text-sm">
              <Sparkles size={20} /> Generate AI Content
            </button>
          </div>
        </div>

        {/* --- 4-COLUMN STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatBox icon={<Clock className="text-blue-500" />} label="Scheduled" value="24" trend="+12%" color="blue" />
          <StatBox icon={<CheckCircle2 className="text-emerald-500" />} label="Published" value="142" trend="+4%" color="emerald" />
          <StatBox icon={<MessageSquare className="text-orange-400" />} label="Pending Approval" value="5" trend="0%" color="orange" />
          <StatBox icon={<Layout className="text-purple-500" />} label="Accounts" value="8" trend="-2%" color="purple" />
        </div>

        {/* --- BOTTOM SECTION: 2/3 and 1/3 SPLIT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Upcoming Posts */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm h-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-900">Upcoming Posts</h3>
                <button className="text-sm font-black text-[#7C3AED] hover:opacity-70">View Calendar</button>
              </div>
              <div className="space-y-4">
                <PostItem platform="TWITTER" time="Today, 2:30 PM" title="10 AI tools that will change your marketing workflow" tagClass="bg-blue-50 text-blue-600" />
                <PostItem platform="INSTAGRAM" time="Tomorrow, 10:00 AM" title="Behind the scenes: How we use SocialAI for growth" tagClass="bg-pink-50 text-pink-600" />
                <PostItem platform="LINKEDIN" time="Nov 14, 09:15 AM" title="Why automation is the future of small business" tagClass="bg-indigo-50 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Right Side: Quick Actions & Activity */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction icon={<Link2 />} label="Connect Account" />
                <QuickAction icon={<Zap />} label="Bulk Generate" />
                <QuickAction icon={<PenTool />} label="Draft Post" />
                <QuickAction icon={<Palette />} label="AI Designer" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">Activity Log</h3>
                <button className="text-xs text-gray-400 font-bold hover:text-primary">View all</button>
              </div>
              <div className="space-y-6 relative ml-2">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-50"></div>
                <LogItem icon={<CheckCircle2 size={14} />} color="emerald" title="Post published successfully" time="Twitter - 12 mins ago" />
                <LogItem icon={<Sparkles size={14} />} color="purple" title="AI generated 4 drafts" time="System - 2 hours ago" />
                <LogItem icon={<Link2 size={14} />} color="blue" title="Connected TikTok account" time="Nov 11, 4:50 PM" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

/* --- HELPER SUB-COMPONENTS (MUST BE OUTSIDE MAIN FUNCTION) --- */

function StatBox({ icon, label, value, trend, color }: any) {
  const bgs: any = { blue: "bg-blue-50", emerald: "bg-emerald-50", orange: "bg-orange-50", purple: "bg-purple-50" };
  return (
    <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgs[color]}`}>
          {icon}
        </div>
        <span className="text-[11px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg tracking-tight">{trend}</span>
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <h3 className="text-3xl font-black text-gray-900 mt-1">{value}</h3>
    </div>
  );
}

function PostItem({ platform, time, title, tagClass }: any) {
  return (
    <div className="flex items-center gap-5 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all cursor-pointer group">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-50"></div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${tagClass}`}>{platform}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{time}</span>
        </div>
        <h4 className="text-[15px] font-bold text-gray-800 group-hover:text-[#7C3AED] transition-colors">{title}</h4>
      </div>
      <div className="flex flex-col justify-between items-end h-16">
        <MoreHorizontal className="text-gray-300" size={20} />
        <RefreshCw className="text-emerald-400" size={16} />
      </div>
    </div>
  );
}

function QuickAction({ icon, label }: any) {
  return (
    <button className="flex flex-col items-center justify-center p-5 rounded-[24px] border border-gray-50 bg-white hover:border-[#7C3AED]/20 hover:bg-purple-50 transition-all group">
      <div className="text-[#7C3AED] mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[10px] font-black text-gray-700 leading-tight uppercase tracking-tight text-center">{label}</span>
    </button>
  );
}

function LogItem({ icon, color, title, time }: any) {
  const colors: any = { emerald: "text-emerald-500", purple: "text-purple-500", blue: "text-blue-500" };
  return (
    <div className="flex gap-4 relative z-10">
      <div className={`w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <h5 className="text-[13px] font-bold text-gray-800">{title}</h5>
        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{time}</p>
      </div>
    </div>
  );
}