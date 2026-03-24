"use client";

import React, { useState } from 'react';
import { Check, Building2, MapPin, Globe, Loader2, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [completeToggle, setCompleteToggle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    industry: "",
    websiteUrl: "",
    location: ""
  });

  const handleComplete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      // Simulate POST /workspace/me/complete-onboarding
      router.push('/workspace');
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 font-sans relative">
      <div className="bg-bg-primary rounded-lg border border-text-secondary/10 p-10 max-w-2xl w-full shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Stepper Logic */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-text-secondary/10 -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-500 z-0" style={{ width: `${(step - 1) * 50}%` }} />
          
          <StepIndicator number={1} label="Workspace Setup" active={step >= 1} />
          <StepIndicator number={2} label="Business Profile" active={step >= 2} />
          <StepIndicator number={3} label="Keyword Selection" active={step >= 3} />
        </div>

        <div className="mb-10 min-h-[220px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-semibold text-text-primary tracking-tight mb-2">Welcome! Let's get started.</h2>
              <p className="text-sm text-text-secondary mb-8">What is the core identity of the workspace?</p>
              
              <Input icon={<Building2 size={16} />} label="Business Name" placeholder="e.g. Acme Corp" value={form.businessName} onChange={(e: any) => setForm({...form, businessName: e.target.value})} />
              
              <div className="w-full mt-4">
                <label className="block text-xs font-semibold text-text-primary mb-2">Industry / Category</label>
                <select 
                  value={form.industry}
                  onChange={(e) => setForm({...form, industry: e.target.value})}
                  className="w-full px-4 py-3 bg-background border border-text-secondary/10 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
                >
                  <option value="" disabled>Select your industry</option>
                  <option value="agency">Marketing Agency</option>
                  <option value="saas">Software & SaaS</option>
                  <option value="ecommerce">E-Commerce</option>
                  <option value="freelance">Freelancer</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-2xl font-semibold text-text-primary tracking-tight mb-2">Business Presence</h2>
              <p className="text-sm text-text-secondary mb-8">Where can people find your business online and physically?</p>
              
              <Input icon={<Globe size={16} />} label="Website URL" placeholder="https://example.com" value={form.websiteUrl} onChange={(e: any) => setForm({...form, websiteUrl: e.target.value})} />
              <Input icon={<MapPin size={16} />} label="Location (City/Country)" placeholder="e.g. New York, USA" value={form.location} onChange={(e: any) => setForm({...form, location: e.target.value})} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-2xl font-semibold text-text-primary tracking-tight mb-2">Keyword Selection</h2>
              <p className="text-sm text-text-secondary mb-8">This module will be configured in your settings explicitly. Confirm onboarding.</p>
              
              <div className="p-6 bg-secondary border border-text-secondary/10 rounded-lg">
                <label className="flex items-center gap-4 cursor-pointer">
                  <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${completeToggle ? 'bg-primary border-primary' : 'border-text-secondary/20 bg-background'}`}>
                    {completeToggle && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                  <input type="checkbox" hidden checked={completeToggle} onChange={(e) => setCompleteToggle(e.target.checked)} />
                  <div>
                    <span className="block text-sm font-semibold text-text-primary">Complete Onboarding</span>
                    <span className="block text-xs text-text-secondary mt-1">I confirm that the core business profile logic is ready.</span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-text-secondary/10">
          <button 
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            className={`px-6 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            Back
          </button>
          
          {step < 3 ? (
            <button 
              disabled={step === 1 && !form.businessName}
              onClick={() => setStep(prev => Math.min(3, prev + 1))}
              className="flex items-center gap-2 px-6 py-2.5 bg-text-primary text-background rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button 
              disabled={!completeToggle || isSubmitting}
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Launch Dashboard
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function StepIndicator({ number, label, active }: any) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${active ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'bg-background border border-text-secondary/20 text-text-secondary'}`}>
        {number}
      </div>
      <span className={`text-[11px] font-semibold whitespace-nowrap absolute -bottom-6 ${active ? 'text-primary' : 'text-text-secondary'}`}>
        {label}
      </span>
    </div>
  );
}

function Input({ label, icon, ...props }: any) {
  return (
    <div className="w-full mt-4">
      <label className="block text-xs font-semibold text-text-primary mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
          {icon}
        </span>
        <input 
          {...props}
          className="w-full pl-11 pr-4 py-3 bg-background border border-text-secondary/10 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
        />
      </div>
    </div>
  );
}
