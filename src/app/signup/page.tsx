"use client"
import React, { useState, useEffect } from 'react';
import { FcGoogle } from "react-icons/fc";
import { 
  Mail, Lock, ArrowRight, CheckCircle2, 
  ShieldCheck, RefreshCw, ChevronLeft, 
  Loader2, Eye, EyeOff, User 
} from 'lucide-react';




  const handleGoogleLogin = () => {
  window.location.href = "https://wenona-polydisperse-aracely.ngrok-free.dev/auth/google";
};


const SignupFlow = () => {
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'success'
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States mapped to your API Schema
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');

  const API_BASE = "http://135.181.242.234:7860";

  // Handle Resend Countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (e:any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. POST /auth/signup
  const handleSignup = async (e:any) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Auto-detect e.g. "Asia/Karachi"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      alert((err as Error).message || "Connection error");
    } finally {
      setLoading(false);
    }
  };

  // 2. POST /auth/verify-email
  const handleVerify = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: otp 
        }),
      });

      if (!res.ok) throw new Error("Invalid or expired OTP");
      setStep('success');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 3. POST /auth/resend-verification
  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      if (res.ok) {
        setResendTimer(60);
        alert("Verification code resent!");
      }
    } catch (err) {
      alert("Failed to resend code");
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background p-4 text-txt-primary">
      <div className="w-full max-w-md bg-bg-primary rounded-3xl shadow-sm border border-background p-8 md:p-10 z-10 transition-all duration-500">
        
        {/* --- STEP 1: SIGNUP FORM --- */}
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
                  className="w-full px-4 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                />
                <input 
                  name="lastName" placeholder="Last Name" required 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-secondary" />
                <input 
                  name="email" type="email" placeholder="Email Address" required 
                  onChange={handleChange} 
                  className="w-full pl-12 pr-4 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-secondary" />
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" required 
                  onChange={handleChange} 
                  className="w-full pl-12 pr-12 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-txt-secondary hover:text-primary transition-colors"
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
                  className="w-full pl-12 pr-4 py-3 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                />
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-primary hover:bg-[#6D28D9] text-white font-semibold py-4 rounded-2xl flex items-center justify-center transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Sign Up <ArrowRight className="ml-2 w-5 h-5" /></>}
              </button>
            </form>

            <div className="relative flex py-6 items-center">
              <div className="flex-grow border-t border-txt-secondary/20"></div>
              <span className="mx-4 text-xs font-bold text-txt-secondary uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-txt-secondary/20"></div>
            </div>

            <button 
                        type="button" 
                        onClick={handleGoogleLogin} 
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-xl transition-colors font-medium text-txt-primary hover:bg-background active:scale-95 "
                      >
                        <FcGoogle className="w-6 h-6 sm:w-8 sm:h-8" />
                        <span className="text-sm sm:text-base">{loading ? "Connecting..." : "Continue with Google"}</span>
                      </button>
          </div>
        )}

        {/* --- STEP 2: OTP VERIFICATION --- */}
        {step === 'otp' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
            <button onClick={() => setStep('form')} className="flex items-center text-txt-secondary hover:text-primary transition-colors text-sm">
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
                className="w-full text-center text-4xl tracking-[1rem] font-bold py-5 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
              />
              <button disabled={loading} className="w-full bg-primary text-white font-bold py-4 rounded-2xl transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "Verify & Continue"}
              </button>
            </form>
            <button 
              onClick={handleResend} 
              disabled={resendTimer > 0}
              className={`flex items-center mx-auto font-bold text-sm transition-all ${resendTimer > 0 ? 'text-txt-secondary cursor-not-allowed' : 'text-primary hover:underline'}`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${resendTimer > 0 ? '' : 'animate-pulse'}`} />
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </button>
          </div>
        )}

        {/* --- STEP 3: SUCCESS --- */}
        {step === 'success' && (
          <div className="text-center py-6 animate-in zoom-in-90 duration-500">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-2">Verified!</h1>
            <p className="text-txt-secondary mb-8 leading-relaxed">Your account is ready. Welcome to the workspace.</p>
            <button className="w-full bg-txt-primary text-bg-primary font-bold py-4 rounded-2xl hover:opacity-90">
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </section>
  );
};

export default SignupFlow;