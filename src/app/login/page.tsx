"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff } from "lucide-react"; 

const LoginPage = () => {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
  window.location.href = "https://wenona-polydisperse-aracely.ngrok-free.dev/auth/google";
};

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://wenona-polydisperse-aracely.ngrok-free.dev/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email,
          password: password,
          deviceId: "web-chrome-device-001",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        router.push("/dashboard"); 
      } else {
        setError(data.detail || "Invalid login credentials");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="min-h-screen w-screen flex flex-col items-center justify-center bg-background relative overflow-hidden font-sans p-4">
        <div className="z-10 w-full max-w-[480px] bg-bg-primary rounded-[32px] border border-background p-6 sm:p-10 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-txt-primary mb-2">Welcome Back</h1>
            <p className="text-sm sm:text-base text-txt-secondary">Log in to manage your social media automation</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
              {error}
            </div>
          )}

          <div className="space-y-3 mb-8">
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

          <div className="relative flex items-center my-8">
            <div className="flex-grow border-t border-txt-secondary/30"></div>
            <span className="flex-shrink mx-4 text-[10px] sm:text-xs font-semibold text-txt-secondary uppercase tracking-widest">
              or continue with email
            </span>
            <div className="flex-grow border-t border-txt-secondary/30"></div>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-txt-primary mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-3 bg-background border border-bg-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-txt-primary">Password</label>
                <a href="/forgot_password" className="text-xs font-bold text-primary hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-background border border-bg-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-txt-secondary hover:text-txt-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-4 bg-primary hover:scale-105 duration-200 text-white rounded-xl font-bold text-base sm:text-lg transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-txt-secondary">
              Don't have an account?{" "}
              <a href="/signup" className="text-primary font-bold hover:underline transition-all">
                Sign up now
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default LoginPage;