"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const BASE_URL = "http://135.181.242.234:7860";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ GOOGLE LOGIN: Redirects to backend to start OAuth
  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}/auth/google`;
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email,
          password,
          deviceId: "web-chrome-device-001"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ STORE FOR LATER USE (7 Days Persistence)
        const cookieStr = "path=/; max-age=604800; samesite=lax";
        document.cookie = `accessToken=${data.accessToken}; ${cookieStr}`;
        document.cookie = `refreshToken=${data.refreshToken}; ${cookieStr}`;

        localStorage.setItem("accessToken", data.accessToken);

        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid login credentials");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen w-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="z-10 w-full max-w-[480px] bg-bg-primary rounded-[32px] border border-background p-10 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-txt-primary mb-2">Welcome Back</h1>
          <p className="text-txt-secondary">Log in to your workspace</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-xl text-sm font-bold border border-red-500/20 text-center">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-4 border rounded-2xl transition-all font-bold text-txt-primary hover:bg-background active:scale-95 mb-8"
        >
          <FcGoogle className="w-6 h-6" />
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center my-8">
          <div className="flex-grow border-t border-txt-secondary/20"></div>
          <span className="mx-4 text-[10px] font-black text-txt-secondary uppercase tracking-widest">or email</span>
          <div className="flex-grow border-t border-txt-secondary/20"></div>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary text-txt-primary"
            placeholder="name@company.com"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-background border border-bg-primary rounded-2xl outline-none focus:ring-2 focus:ring-primary text-txt-primary"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-txt-secondary"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Log In"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;