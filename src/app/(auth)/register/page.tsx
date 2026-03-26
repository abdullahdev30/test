"use client";

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from "react-icons/fc";
import {
  Mail, Lock, ArrowRight, CheckCircle2,
  ShieldCheck, RefreshCw, ChevronLeft, Globe2,
  Loader2, Eye, EyeOff
} from 'lucide-react';
import { signup, verifyEmail, resendVerification } from '@/lib/api/auth';

const GOOGLE_AUTH_URL = "/api/auth/google";
const FALLBACK_TIMEZONES = [
  'UTC',
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Istanbul',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function getTimezoneOptions() {
  const intlWithSupported = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof intlWithSupported.supportedValuesOf === 'function') {
    const zones = intlWithSupported.supportedValuesOf('timeZone');
    if (zones.length > 0) return zones;
  }
  return FALLBACK_TIMEZONES;
}

function getDefaultTimezone(timezones: string[]) {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (browserTimezone && timezones.includes(browserTimezone)) return browserTimezone;
  return 'UTC';
}

const SignupFlow = () => {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);

  const [formData, setFormData] = useState(() => ({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    timezone: getDefaultTimezone(timezoneOptions),
  }));
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signup(formData);
      if (!result.success) {
        setError(result.error ?? 'Signup failed');
        return;
      }
      setStep('otp');
      setResendTimer(60);
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await verifyEmail(formData.email, otp);
      if (!result.success) {
        setError(result.error ?? 'Verification failed');
        return;
      }
      setStep('success');
    });
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setError(null);
    startTransition(async () => {
      const result = await resendVerification(formData.email);
      if (result.success) {
        setResendTimer(60);
      } else {
        setError(result.error ?? 'Failed to resend code');
      }
    });
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background p-4 text-txt-primary">
      <div className="w-full max-w-md bg-bg-primary rounded-3xl shadow-sm border border-background p-8 md:p-10 z-10">

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-xl text-sm font-bold border border-red-500/20 text-center">
            {error}
          </div>
        )}

        {step === 'form' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Create Account</h1>
              <p className="text-txt-secondary text-sm">Join creators automating their growth.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSignup}>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="firstName" placeholder="First Name" required
                  onChange={handleChange}
                  autoComplete="given-name"
                  className="w-full px-4 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  name="lastName" placeholder="Last Name" required
                  onChange={handleChange}
                  autoComplete="family-name"
                  className="w-full px-4 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-secondary" />
                <input
                  name="email" type="email" placeholder="Email Address" required
                  onChange={handleChange}
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="relative">
                <Globe2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-secondary pointer-events-none" />
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {timezoneOptions.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-secondary" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 8 chars)" required
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-txt-secondary hover:text-primary"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-secondary" />
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password" required
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full pl-12 pr-4 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                disabled={isPending}
                type="submit"
                className="w-full bg-primary hover:bg-[#6D28D9] text-white font-semibold py-4 rounded-2xl flex items-center justify-center transition-all active:scale-[0.98]"
              >
                {isPending ? <Loader2 className="animate-spin" /> : <>Sign Up <ArrowRight className="ml-2 w-5 h-5" /></>}
              </button>
            </form>

            <div className="relative flex py-6 items-center">
              <div className="flex-grow border-t border-txt-secondary/20"></div>
              <span className="mx-4 text-xs font-bold text-txt-secondary uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-txt-secondary/20"></div>
            </div>

            <button
              type="button"
              onClick={() => window.location.href = GOOGLE_AUTH_URL}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-xl font-medium text-txt-primary hover:bg-background"
            >
              <FcGoogle className="w-6 h-6" />
              <span>Continue with Google</span>
            </button>

            <p className="mt-6 text-center text-sm text-txt-secondary">
              Already have an account?{" "}
              <a href="/login" className="text-primary font-bold hover:underline">Log in</a>
            </p>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
            <button onClick={() => setStep('form')} className="flex items-center text-txt-secondary text-sm">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Verify Email</h2>
              <p className="text-txt-secondary text-sm mt-2">Code sent to <b>{formData.email}</b></p>
            </div>
            <form onSubmit={handleVerify} className="space-y-6">
              <input
                type="text" maxLength={6} value={otp} required placeholder="000000"
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center text-4xl tracking-[0.5rem] font-bold py-5 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
              />
              <button disabled={isPending} type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-2xl transition-all">
                {isPending ? <Loader2 className="animate-spin mx-auto" /> : "Verify & Continue"}
              </button>
            </form>
            <button
              onClick={handleResend}
              disabled={resendTimer > 0 || isPending}
              className={`flex items-center mx-auto font-bold text-sm ${resendTimer > 0 ? 'text-txt-secondary' : 'text-primary'}`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${resendTimer > 0 ? '' : 'animate-pulse'}`} />
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 animate-in zoom-in-90 duration-500">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-2">Verified!</h1>
            <p className="text-txt-secondary mb-8 leading-relaxed">Your account is ready.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-txt-primary text-bg-primary font-bold py-4 rounded-2xl hover:opacity-90"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default SignupFlow;
