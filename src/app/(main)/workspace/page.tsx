"use client";

import React, { useState } from 'react';
import { Briefcase, Link2, Activity, Globe, ArrowRight, Loader2, Check, TrendingUp, Users, Building2 } from 'lucide-react';

export default function WorkspacePage() {
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Workspaces Creation
  const [form, setForm] = useState({ name: "", slug: "" });
  
  // Business Upgrade
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [businessForm, setBusinessForm] = useState({ companyName: "", industry: "" });

  const [activeWorkspace, setActiveWorkspace] = useState({
    name: "SocialAI Hub",
    slug: "socialai-hub",
    plan: "Pro Workspace",
    platforms: 3,
    members: 1
  });

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
      setActiveWorkspace({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        plan: "Free Workspace",
        platforms: 0,
        members: 1
      });
      setIsCreating(false);
      setHasWorkspace(true);
    }, 1200);
  };

  const handleCreateBusiness = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      setActiveWorkspace(prev => ({
        ...prev,
        plan: "Business Workspace",
        name: businessForm.companyName || prev.name
      }));
      setIsUpgrading(false);
      setShowBusinessForm(false);
    }, 1500);
  };

  const autoGenerateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  /* --- SETUP VIEW --- */
  if (!hasWorkspace) {
    return (
      <div className="max-w-4xl mx-auto p-6 lg:p-10 font-sans h-[calc(100vh-64px)] flex flex-col items-center justify-center relative">
        <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 md:p-14 shadow-xl max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
          
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-[24px] flex items-center justify-center mb-8 relative z-10">
            <Briefcase size={32} strokeWidth={2.5} />
          </div>
          
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Create Workspace</h1>
          <p className="text-sm font-medium text-text-secondary mb-10">Set up your agency or team environment to manage clients and accounts.</p>
          
          <div className="space-y-6">
            <div className="w-full">
              <label className="block text-[10px] font-black text-text-secondary mb-2.5 uppercase tracking-[0.2em]">Workspace Name</label>
              <input 
                placeholder="E.g. Acme Agency"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value, slug: autoGenerateSlug(e.target.value) });
                }}
                className="w-full px-6 py-4 border-2 rounded-[20px] outline-none text-[15px] font-black transition-all bg-background border-text-secondary/10 focus:border-primary text-text-primary shadow-sm"
              />
            </div>
            
            <div className="w-full">
              <label className="block text-[10px] font-black text-text-secondary mb-2.5 uppercase tracking-[0.2em]">Workspace Slug</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-sm">socialai.com/</span>
                <input 
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: autoGenerateSlug(e.target.value) })}
                  className="w-full pl-36 pr-6 py-4 border-2 rounded-[20px] outline-none text-[15px] font-black transition-all bg-background border-text-secondary/10 focus:border-primary text-text-primary shadow-sm"
                />
              </div>
            </div>

            <button 
              onClick={handleCreate}
              disabled={!form.name || isCreating}
              className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/25 active:scale-95 transition-all text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 mt-4"
            >
              {isCreating ? <Loader2 size={18} className="animate-spin" /> : "Create Environment"}
              {!isCreating && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* --- OVERVIEW VIEW --- */
  const isBusiness = activeWorkspace.plan === "Business Workspace";

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 font-sans relative animate-in fade-in duration-500">
      
      {/* BUSINESS UPGRADE MODAL */}
      {showBusinessForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 max-w-sm w-full relative animate-in zoom-in-95 shadow-2xl">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
              <Globe size={32} />
            </div>
            <h2 className="text-2xl font-black text-text-primary mb-2">Business Details</h2>
            <p className="text-text-secondary font-medium text-sm mb-8">Enter your company details to upgrade to a free Business Workspace.</p>
            
            <div className="space-y-5 mb-8">
              <div className="w-full">
                <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-[0.2em]">Company Name</label>
                <input 
                  placeholder="e.g. Acme Corp" 
                  value={businessForm.companyName}
                  onChange={(e) => setBusinessForm({...businessForm, companyName: e.target.value})}
                  className="w-full px-5 py-3.5 border-2 rounded-[16px] outline-none text-[14px] font-black transition-all bg-background border-text-secondary/10 focus:border-primary text-text-primary shadow-sm"
                />
              </div>
              <div className="w-full">
                <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-[0.2em]">Industry</label>
                <select 
                  value={businessForm.industry}
                  onChange={(e) => setBusinessForm({...businessForm, industry: e.target.value})}
                  className="w-full px-5 py-3.5 border-2 rounded-[16px] outline-none text-[14px] font-black transition-all bg-background border-text-secondary/10 focus:border-primary text-text-secondary shadow-sm appearance-none"
                >
                  <option value="" disabled>Select an Industry</option>
                  <option value="agency">Marketing Agency</option>
                  <option value="ecommerce">E-Commerce</option>
                  <option value="tech">Technology / SaaS</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button disabled={isUpgrading} onClick={() => setShowBusinessForm(false)} className="flex-1 py-4 text-xs font-black text-text-secondary hover:bg-text-primary/5 rounded-2xl transition-all uppercase tracking-widest disabled:opacity-50">Cancel</button>
              <button 
                disabled={!businessForm.companyName || isUpgrading} 
                onClick={handleCreateBusiness} 
                className="flex-[1.5] py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isUpgrading ? <Loader2 size={16} className="animate-spin" /> : "Complete Setup"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Workspace Overview</h1>
          <p className="text-text-secondary mt-2 font-bold uppercase text-[11px] tracking-[0.2em]">Environment Settings</p>
        </div>
        <button 
          onClick={() => setHasWorkspace(false)}
          className="px-6 py-3 border-2 border-text-secondary/10 text-text-secondary font-black rounded-2xl hover:bg-text-secondary/5 transition-all text-xs uppercase tracking-widest"
        >
          Switch Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Details Card */}
        <div className={`md:col-span-2 bg-bg-primary rounded-[40px] border p-10 shadow-sm relative overflow-hidden transition-all ${isBusiness ? 'border-primary/30 shadow-primary/5' : 'border-text-secondary/10'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex items-start gap-6 mb-12 relative z-10">
            <div className="w-20 h-20 bg-primary/10 border-4 border-primary/20 text-primary rounded-[28px] flex items-center justify-center shadow-inner">
              {isBusiness ? <Building2 size={36} strokeWidth={2.5} /> : <Briefcase size={36} strokeWidth={2.5} />}
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-text-primary tracking-tight">{activeWorkspace.name}</h2>
                <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active</span>
                {isBusiness && <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Business</span>}
              </div>
              <p className="text-primary font-bold text-sm tracking-wide mt-1">socialai.com/{activeWorkspace.slug}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
             <div className="bg-background border-2 border-text-secondary/10 rounded-3xl p-6">
               <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3">Plan Tier</p>
               <p className="text-lg font-black text-text-primary">{activeWorkspace.plan}</p>
             </div>
             <div className="bg-background border-2 border-text-secondary/10 rounded-3xl p-6">
               <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3">Linked Accounts</p>
               <p className="text-lg font-black text-text-primary flex items-center gap-2"><Link2 size={18} className="text-primary"/> {activeWorkspace.platforms} Networks</p>
             </div>
             <div className="bg-background border-2 border-text-secondary/10 rounded-3xl p-6">
               <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3">Team Status</p>
               <p className="text-lg font-black text-text-primary flex items-center gap-2"><Activity size={18} className="text-emerald-500" /> Operational</p>
             </div>
          </div>
        </div>

        {/* Upgrade / Business Options */}
        <div className="flex flex-col gap-8">
          {!isBusiness ? (
            <div className="bg-[#1e1b4b] rounded-[40px] p-10 shadow-2xl relative overflow-hidden text-white flex-1 flex flex-col h-full bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
              <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-300 backdrop-blur-md border border-indigo-400/20">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 text-white leading-tight">Create Business Workspace</h3>
              <p className="text-indigo-200 text-sm font-medium mb-8 leading-relaxed">
                Connect dedicated ad accounts and unlock unlimited powerful analytics—for free.
              </p>
              <div className="mt-auto">
                <button 
                  onClick={() => setShowBusinessForm(true)}
                  className="w-full py-4 bg-white text-indigo-900 font-black rounded-2xl shadow-xl shadow-white/10 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-4 border-transparent hover:border-indigo-400"
                >
                  Start For Free <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
             <div className="bg-bg-primary border border-text-secondary/10 rounded-[40px] p-10 shadow-sm relative overflow-hidden flex-1 flex flex-col h-full">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 text-text-primary leading-tight">Business Active</h3>
              <p className="text-text-secondary text-sm font-medium mb-8 leading-relaxed">
                Your company workspace is fully equipped to scale up API endpoints.
              </p>
              <div className="mt-auto">
                <button className="w-full py-4 bg-background border px-4 border-text-secondary/10 text-text-primary font-black rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:border-primary/30">
                  <Users size={14} /> Invite Team Members
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
