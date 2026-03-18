"use client";
import React, { useState, useRef } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // ✅ 6 digit
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const BASE_URL = "http://135.181.242.234:7860";

  // ---------------- OTP INPUT ----------------
  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; 
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ---------------- SEND OTP ----------------
  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  // ---------------- VERIFY + RESET ----------------
  const handleVerify = async () => {
    const otpValue = otp.join("");

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: otpValue,
          newPassword,
          confirmPassword,
        }),
      });

      if (!res.ok) throw new Error("Invalid OTP");

      alert("Password reset successful ✅");
      window.location.href = "/login";
    } catch (err) {
      alert("Invalid OTP or error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-bg-primary z-10 rounded-2xl p-8 shadow-2xl transition-all duration-500">
          
          {step === 'email' ? (
            /* --- STEP 1: EMAIL INPUT --- */
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-8 flex flex-col items-center text-center">
                <h1 className="text-3xl font-bold text-txt-primary tracking-tight">Forgot password?</h1>
                <p className="text-txt-secondary mt-2 text-sm leading-relaxed">
                  No worries, we'll send you reset instructions to your inbox.
                </p>
              </div>

              <form onSubmit={handleSendReset} className="space-y-6">
                <div>
                  <label className="block text-xl font-bold text-txt-primary mb-2 ml-1">
                    Email address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-txt-secondary group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-background border border-bg-primary rounded-xl text-txt-primary placeholder:text-txt-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Enter your registered email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-[#6D28D9] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98]"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <button onClick={() => (window.location.href="/login")} className="mt-8 w-full flex cursor-pointer items-center justify-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors">
                <ArrowLeft size={16} />
                Back to log in
              </button>
            </div>
          ) : (
            /* --- STEP 2: OTP + PASSWORD --- */
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-8 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-txt-primary tracking-tight">Check your email</h1>
                <p className="text-txt-secondary mt-2 text-sm leading-relaxed px-4">
                  We've sent a 6-digit code to your email<br/>
                  <span className="text-primary font-medium">{email}</span>
                </p> 
              </div>

              {/* OTP */}
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="w-14 h-16 text-center text-2xl font-bold bg-background border border-gray-700 rounded-xl text-txt-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ))}
              </div>

              {/* PASSWORDS */}
              <div className="space-y-4 mb-6">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-gray-700 rounded-xl text-txt-primary placeholder:text-txt-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-gray-700 rounded-xl text-txt-primary placeholder:text-txt-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button 
                onClick={handleVerify}
                className="w-full bg-primary text-white font-semibold py-3.5 cursor-pointer rounded-xl shadow-lg shadow-indigo-500/20 transition-all mb-6"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="text-center space-y-4">
                <p className="text-sm text-txt-secondary">
                  Didn't receive the email?{" "}
                  <button className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium">Click to resend</button>
                </p>
                <button 
                  onClick={() => setStep('email')}
                  className="text-xs text-txt-secoundary cursor-pointer underline underline-offset-4"
                >
                  Change email address
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-gray-800/50 text-center">
            <p className="text-xs text-gray-500">
              Having trouble? <a href="#" className="text-indigo-500 hover:underline">Contact our support team</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}