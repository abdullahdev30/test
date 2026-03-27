"use client";

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from "react-icons/fc";
import {
  Mail, Lock, ArrowRight, CheckCircle2,
  ShieldCheck, RefreshCw, ChevronLeft, Globe2,
  Eye, EyeOff
} from 'lucide-react';
import { signup, verifyEmail, resendVerification } from '@/lib/api/auth';
import { Alert, Button, Card, Input, Select } from '@/components/common';

const GOOGLE_OAUTH_START_URL = "/api/auth/google";
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

  const handleGoogleLogin = () => {
    setError(null);
    window.location.href = `${GOOGLE_OAUTH_START_URL}?next=${encodeURIComponent('/dashboard')}`;
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background p-4 text-txt-primary">
      <Card className="w-full max-w-md rounded-3xl border-background p-8 md:p-10 z-10 shadow-sm">

        {error && (
          <Alert variant="alert" className="mb-4 text-center">
            {error}
          </Alert>
        )}

        {step === 'form' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Create Account</h1>
              <p className="text-txt-secondary text-sm">Join creators automating their growth.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSignup}>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="firstName" placeholder="First Name" required
                  onChange={handleChange}
                  autoComplete="given-name"
                  className="rounded-2xl"
                  variant="filled"
                />
                <Input
                  name="lastName" placeholder="Last Name" required
                  onChange={handleChange}
                  autoComplete="family-name"
                  className="rounded-2xl"
                  variant="filled"
                />
              </div>

              <Input
                name="email" type="email" placeholder="Email Address" required
                onChange={handleChange}
                autoComplete="email"
                className="rounded-2xl"
                variant="filled"
                leftIcon={<Mail className="w-5 h-5" />}
              />

              <div className="relative">
                <Globe2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-secondary pointer-events-none z-10" />
                <Select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="rounded-2xl pl-12"
                  variant="filled"
                  required
                >
                  {timezoneOptions.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 8 chars)" required
                onChange={handleChange}
                autoComplete="new-password"
                className="rounded-2xl"
                variant="filled"
                leftIcon={<Lock className="w-5 h-5" />}
                rightNode={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-txt-secondary hover:text-primary"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />

              <Input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password" required
                onChange={handleChange}
                autoComplete="new-password"
                className="rounded-2xl"
                variant="filled"
                leftIcon={<ShieldCheck className="w-5 h-5" />}
              />

              <Button
                disabled={isPending}
                type="submit"
                isLoading={isPending}
                className="w-full py-4 rounded-2xl"
                rightIcon={!isPending ? <ArrowRight className="w-5 h-5" /> : undefined}
              >
                Sign Up
              </Button>
            </form>

            <div className="relative flex py-6 items-center">
              <div className="flex-grow border-t border-txt-secondary/20"></div>
              <span className="mx-4 text-xs font-bold text-txt-secondary uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-txt-secondary/20"></div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full py-3 px-4 rounded-xl font-medium text-txt-primary"
            >
              <FcGoogle className="w-6 h-6" />
              <span>Continue with Google</span>
            </Button>

            <p className="mt-6 text-center text-sm text-txt-secondary">
              Already have an account?{" "}
              <a href="/login" className="text-primary font-bold hover:underline">Log in</a>
            </p>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
            <Button onClick={() => setStep('form')} variant="ghost" size="sm" className="text-txt-secondary text-sm px-0">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Verify Email</h2>
              <p className="text-txt-secondary text-sm mt-2">Code sent to <b>{formData.email}</b></p>
            </div>
            <form onSubmit={handleVerify} className="space-y-6">
              <Input
                type="text" maxLength={6} value={otp} required placeholder="000000"
                onChange={(e) => setOtp(e.target.value)}
                className="text-center text-4xl tracking-[0.5rem] font-bold py-5 rounded-2xl"
                variant="filled"
              />
              <Button disabled={isPending} isLoading={isPending} type="submit" className="w-full py-4 rounded-2xl">
                Verify & Continue
              </Button>
            </form>
            <Button
              onClick={handleResend}
              disabled={resendTimer > 0 || isPending}
              variant="ghost"
              size="sm"
              className={`mx-auto font-bold text-sm ${resendTimer > 0 ? 'text-txt-secondary' : 'text-primary'}`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${resendTimer > 0 ? '' : 'animate-pulse'}`} />
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 animate-in zoom-in-90 duration-500">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-2">Verified!</h1>
            <p className="text-txt-secondary mb-8 leading-relaxed">Your account is ready.</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-txt-primary text-bg-primary rounded-2xl py-4 hover:opacity-90"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
};

export default SignupFlow;
