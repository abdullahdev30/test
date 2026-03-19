"use client";
import React, { useState, useRef } from 'react';
import { Mail, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ---------------- OTP LOGIC ----------------
  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ---------------- STEP 1: SEND OTP ----------------
  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://135.181.242.234:7860/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      setStep('otp');
    } catch (err) {
      alert("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- STEP 2: VERIFY OTP ----------------
  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join("") }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid OTP");
      }
      setStep('password');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- STEP 3: FINAL RESET ----------------
  const handleFinalReset = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", { // Fixed endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, confirmPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Reset failed");
      }

      window.location.href = "/login";
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-primary z-10 rounded-2xl p-8 shadow-2xl transition-all duration-500">
        
        {step === 'email' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-txt-primary">Forgot password?</h1>
              <p className="text-txt-secondary mt-2 text-sm">Instructions will be sent to your inbox.</p>
            </div>
            <form onSubmit={handleSendReset} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><Mail className="h-5 w-5 text-txt-secondary" /></div>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-background border border-bg-primary rounded-xl text-txt-primary outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your email"
                />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl">
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-txt-primary">Verify OTP</h1>
              <p className="text-txt-secondary mt-2 text-sm leading-relaxed">
                Enter the 6-digit code sent to <br />
                <span className="text-primary font-medium">{email}</span>
              </p> 
            </div>

            {/* OTP INPUT GRID */}
            <div className="flex justify-center gap-2 mb-8">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-12 h-14 text-center text-xl font-bold bg-background border border-gray-700 rounded-xl text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              ))}
            </div>

            <button onClick={handleVerifyOtp} disabled={isLoading} className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl shadow-lg">
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="text-center mt-6">
              <button className="text-sm text-primary hover:underline font-medium">Resend Code</button>
            </div>
          </div>
        )}

        {step === 'password' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-txt-primary">New Password</h1>
              <p className="text-txt-secondary mt-2 text-sm">Please choose a strong password.</p>
            </div>
            <div className="space-y-4 mb-6">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 pr-12 py-3 bg-background border border-gray-700 rounded-xl text-txt-primary focus:ring-2 focus:ring-primary outline-none"
                />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-txt-secondary">
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 pr-12 py-3 bg-background border border-gray-700 rounded-xl text-txt-primary focus:ring-2 focus:ring-primary outline-none"
                />
                <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-txt-secondary">
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button onClick={handleFinalReset} disabled={isLoading} className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl">
              {isLoading ? "Updating..." : "Reset Password"}
            </button>
          </div>
        )}

        <button 
          onClick={() => step === 'email' ? window.location.href="/login" : setStep('email')} 
          className="mt-8 w-full flex items-center justify-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors"
        >
          <ArrowLeft size={16} />
          {step === 'email' ? "Back to log in" : "Change email address"}
        </button>
      </div>
    </div>
  );
}