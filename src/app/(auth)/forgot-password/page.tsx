"use client";
import React, { useState, useRef } from 'react';
import { Mail, ArrowLeft, KeyRound, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');

  // Data States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // BASE URL - Removed trailing slash to prevent 404s
  const BASE_URL = "http://135.181.242.234:7860";

  // --- SAFE FETCH WRAPPER ---
  // This function prevents the "Unexpected Token <" crash
  const safeFetch = async (endpoint: string, body: object) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      return data;
    } else {
      // If server sends HTML, we capture it to see the error
      const htmlError = await response.text();
      console.error("SERVER ERROR HTML:", htmlError);
      throw new Error(`Server returned HTML (Error ${response.status}). Check console.`);
    }
  };

  // ---------------- STEP 1: FORGOT PASSWORD ----------------
  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await safeFetch("/auth/forgot-password", { email });
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- STEP 2: VERIFY OTP ----------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await safeFetch("/auth/verify-reset-otp", {
        email,
        otp: otp.join("")
      });
      // Capture the token returned by your backend
      setResetToken(data.resetToken || data.token);
      setStep('password');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- STEP 3: RESET PASSWORD ----------------
  const handleFinalReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await safeFetch("/auth/reset-password", {
        email,
        resetToken,
        newPassword,
        confirmPassword
      });
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP Input Handler ---
  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] bg-bg-primary rounded-[32px] p-8 md:p-10 shadow-2xl border border-background">

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
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendReset} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-secondary w-5 h-5" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary text-txt-primary" placeholder="Enter email" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90">{isLoading ? "Sending..." : "Continue"}</button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input key={idx} ref={(el) => { inputRefs.current[idx] = el; }} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(e.target.value, idx)} className="w-full h-14 text-center text-xl font-bold bg-background border border-bg-primary rounded-xl text-txt-primary focus:ring-2 focus:ring-primary outline-none" />
              ))}
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-bold py-4 rounded-2xl">{isLoading ? "Verifying..." : "Verify Code"}</button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleFinalReset} className="space-y-4">
            <div className="relative">
              <input type={showPass ? "text" : "password"} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 pr-12 py-3.5 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary text-txt-primary" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-txt-secondary">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3.5 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary text-txt-primary" />
            <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-bold py-4 rounded-2xl">Reset Password</button>
          </form>
        )}

        <button onClick={() => step === 'email' ? router.push("/login") : setStep('email')} className="mt-8 w-full flex items-center justify-center gap-2 text-xs text-txt-secondary font-bold hover:text-primary transition-colors">
          <ArrowLeft size={14} /> Back to Login
        </button>
      </div>
    </div>
  );
}