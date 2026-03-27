"use client";

import React, { useState, useTransition } from 'react';
import { Check, Building2, MapPin, Globe, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Alert, Button, Card, Checkbox, Input, Select } from '@/components/common';

// Auto-generate slug from workspace name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function OnboardingPage() {
  const router = useRouter();
  const { createWorkspace, upsertBusinessProfile, completeOnboarding } = useWorkspace();
  const [, startTransition] = useTransition();

  const [step, setStep] = useState(1);
  const [completeToggle, setCompleteToggle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Step 1 — Workspace identity
    businessName: '',
    industry: '',
    // Step 2 — Business presence
    websiteUrl: '',
    city: '',
    country: '',
  });

  // ── Step 1: Create/update workspace ────────────────────────────────────────
  const handleStep1Next = async () => {
    if (!form.businessName) return;
    setIsSubmitting(true);
    setApiError(null);

    startTransition(async () => {
      const result = await createWorkspace({
        name: form.businessName,
        slug: slugify(form.businessName),
      });

      setIsSubmitting(false);
      if (!result.success) {
        setApiError(result.error ?? 'Failed to create workspace');
      } else {
        setStep(2);
      }
    });
  };

  // ── Step 2: Save business profile basics ───────────────────────────────────
  const handleStep2Next = async () => {
    setIsSubmitting(true);
    setApiError(null);

    startTransition(async () => {
      const result = await upsertBusinessProfile({
        businessName: form.businessName,
        industry: form.industry || undefined,
        websiteUrl: form.websiteUrl || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
      });

      setIsSubmitting(false);
      if (!result.success) {
        setApiError(result.error ?? 'Failed to save business details');
      } else {
        setStep(3);
      }
    });
  };

  // ── Step 3: Redirect to workspace ─────────────────────────────────────────
  const handleComplete = () => {
    if (!completeToggle) return;
    setIsSubmitting(true);
    setApiError(null);
    startTransition(async () => {
      const result = await completeOnboarding({ confirm: true });
      setIsSubmitting(false);
      if (!result.success) {
        setApiError(result.error ?? 'Failed to complete onboarding');
        return;
      }
      router.push('/workspace');
    });
  };

  const handleNext = () => {
    if (step === 1) return handleStep1Next();
    if (step === 2) return handleStep2Next();
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 font-sans relative">
      <Card className="rounded-lg p-10 max-w-2xl w-full shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-text-secondary/10 -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-500 z-0" style={{ width: `${(step - 1) * 50}%` }} />
          <StepIndicator number={1} label="Workspace Setup" active={step >= 1} />
          <StepIndicator number={2} label="Business Profile" active={step >= 2} />
          <StepIndicator number={3} label="Confirm Launch" active={step >= 3} />
        </div>

        {/* API Error Banner */}
        {apiError && (
          <Alert variant="alert" className="mb-6 text-sm">
            {apiError}
          </Alert>
        )}

        <div className="mb-10 min-h-[220px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-semibold text-text-primary tracking-tight mb-2">Welcome! Let&apos;s get started.</h2>
              <p className="text-sm text-text-secondary mb-8">What is the core identity of the workspace?</p>

              <Input leftIcon={<Building2 size={16} />} containerClassName="mt-4" className="rounded-lg border-text-secondary/10"
                placeholder="e.g. Acme Corp"
                value={form.businessName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, businessName: e.target.value })} />

              {/* Slug preview */}
              {form.businessName && (
                <p className="text-xs text-text-secondary ml-1">
                  Slug: <span className="text-primary font-semibold">{slugify(form.businessName)}</span>
                </p>
              )}

              <div className="w-full mt-4">
                <label className="block text-xs font-semibold text-text-primary mb-2">Industry / Category</label>
                <Select
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="border-text-secondary/10 rounded-lg"
                >
                  <option value="" disabled>Select your industry</option>
                  <option value="agency">Marketing Agency</option>
                  <option value="saas">Software & SaaS</option>
                  <option value="ecommerce">E-Commerce</option>
                  <option value="freelance">Freelancer</option>
                  <option value="retail">Retail</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-2xl font-semibold text-text-primary tracking-tight mb-2">Business Presence</h2>
              <p className="text-sm text-text-secondary mb-8">Where can people find your business online and physically?</p>

              <Input leftIcon={<Globe size={16} />} containerClassName="mt-4" className="rounded-lg border-text-secondary/10" placeholder="https://example.com"
                value={form.websiteUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, websiteUrl: e.target.value })} />
              <Input leftIcon={<MapPin size={16} />} containerClassName="mt-4" className="rounded-lg border-text-secondary/10" placeholder="e.g. New York"
                value={form.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, city: e.target.value })} />
              <Input leftIcon={<MapPin size={16} />} containerClassName="mt-4" className="rounded-lg border-text-secondary/10" placeholder="e.g. USA"
                value={form.country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, country: e.target.value })} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-2xl font-semibold text-text-primary tracking-tight mb-2">You&apos;re Almost There!</h2>
              <p className="text-sm text-text-secondary mb-8">Your workspace has been set up. Confirm to launch your dashboard.</p>

              <Card variant="soft" className="p-6 rounded-lg">
                <label className="flex items-center gap-4 cursor-pointer">
                  <div
                    className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${completeToggle ? 'bg-primary border-primary' : 'border-text-secondary/20 bg-background'}`}
                    onClick={() => setCompleteToggle(!completeToggle)}
                  >
                    {completeToggle && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                  <Checkbox hidden checked={completeToggle} onChange={(e) => setCompleteToggle(e.target.checked)} />
                  <div>
                    <span className="block text-sm font-semibold text-text-primary">Complete Onboarding</span>
                    <span className="block text-xs text-text-secondary mt-1">I confirm that the core business profile is ready.</span>
                  </div>
                </label>
              </Card>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-text-secondary/10">
          <Button
            onClick={() => { setApiError(null); setStep(prev => Math.max(1, prev - 1)); }}
            variant="ghost"
            className={`px-6 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            Back
          </Button>

          {step < 3 ? (
            <Button
              disabled={isSubmitting || (step === 1 && !form.businessName)}
              onClick={handleNext}
              isLoading={isSubmitting}
              className="gap-2 px-6 py-2.5 bg-text-primary text-background rounded-lg text-sm font-semibold hover:opacity-90"
            >
              Continue
            </Button>
          ) : (
            <Button
              disabled={!completeToggle || isSubmitting}
              onClick={handleComplete}
              className="gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm"
            >
              <Play size={16} />
              Launch Dashboard
            </Button>
          )}
        </div>

      </Card>
    </div>
  );
}

function StepIndicator({ number, label, active }: { number: number; label: string; active: boolean }) {
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
