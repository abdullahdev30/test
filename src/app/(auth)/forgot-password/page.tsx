"use client";
import React, { useState, useRef, useTransition } from 'react';
import { Mail, ArrowLeft, KeyRound, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { forgotPassword, verifyResetOtp, resetPassword } from '@/lib/api/auth';
import { Alert, Button, Card, Input } from '@/components/common';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [isPending, startTransition] = useTransition();

  // Data States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // STEP 1
  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await forgotPassword(email);
      if (!result.success) {
        setError(result.error ?? 'Failed to send reset email');
        return;
      }
      setStep('otp');
    });
  };

  // STEP 2
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyResetOtp(email, otp.join(''));
      if (!result.success || !result.resetToken) {
        setError(result.error ?? 'OTP verification failed');
        return;
      }
      setResetToken(result.resetToken);
      setStep('password');
    });
  };

  // STEP 3
  const handleFinalReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resetPassword({ email, resetToken, newPassword, confirmPassword });
      if (!result.success) {
        setError(result.error ?? 'Password reset failed');
        return;
      }
      router.push('/login');
    });
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-[440px] rounded-[32px] p-8 md:p-10 shadow-2xl border-background">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {step === 'email' && <KeyRound className="text-primary" />}
            {step === 'otp' && <ShieldCheck className="text-primary" />}
            {step === 'password' && <Lock className="text-primary" />}
          </div>
          <h1 className="text-2xl font-bold text-txt-primary">
            {step === 'email' ? "Forgot Password" : step === 'otp' ? "Verify Email" : "New Password"}
          </h1>
          <p className="text-txt-secondary text-sm mt-2">
            {step === 'email' ? "We'll send a code to your email." : step === 'otp' ? `Code sent to ${email}` : "Create a strong new password."}
          </p>
        </div>

        {error && (
          <Alert variant="alert" className="mb-6 text-center text-xs font-bold">
            {error}
          </Alert>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendReset} className="space-y-5">
            <Input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="rounded-2xl py-3.5 text-txt-primary"
              placeholder="Enter email"
              variant="filled"
              leftIcon={<Mail className="w-5 h-5" />}
            />
            <Button type="submit" disabled={isPending} isLoading={isPending} className="w-full py-4 rounded-2xl">
              Continue
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <Input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  className="h-14 text-center text-xl font-bold rounded-xl text-txt-primary"
                  variant="filled"
                />
              ))}
            </div>
            <Button type="submit" disabled={isPending} isLoading={isPending} className="w-full py-4 rounded-2xl">
              Verify Code
            </Button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleFinalReset} className="space-y-4">
            <Input
              type={showPass ? "text" : "password"}
              placeholder="New Password (min 8 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="rounded-2xl py-3.5 text-txt-primary"
              required
              variant="filled"
              rightNode={
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-txt-secondary" aria-label={showPass ? "Hide password" : "Show password"}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <Input
              type="password" placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="rounded-2xl py-3.5 text-txt-primary"
              required
              variant="filled"
            />
            <Button type="submit" disabled={isPending} isLoading={isPending} className="w-full py-4 rounded-2xl">
              Reset Password
            </Button>
          </form>
        )}

        <Button
          onClick={() => step === 'email' ? router.push("/login") : setStep('email')}
          variant="ghost"
          size="sm"
          className="mt-8 w-full text-xs text-txt-secondary font-bold hover:text-primary"
        >
          <ArrowLeft size={14} /> Back to Login
        </Button>
      </Card>
    </div>
  );
}
