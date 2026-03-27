"use client";

import React, { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/api/auth";
import { Alert, Button, Card, Input } from "@/components/common";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGoogleLogin = () => {
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard";
    const oauthUrl = `/api/auth/google?next=${encodeURIComponent(callbackUrl)}`;
    // Redirect through a server-side proxy — backend URL never exposed
    window.location.href = oauthUrl;
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error ?? "Login failed");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <section className="min-h-screen w-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="z-10 w-full max-w-[480px] rounded-[32px] border-background p-10 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-txt-primary mb-2">Welcome Back</h1>
          <p className="text-txt-secondary">Log in to your workspace</p>
        </div>

        {error && (
          <Alert variant="alert" className="mb-4 text-center">
            {error}
          </Alert>
        )}

        <Button
          type="button"
          onClick={handleGoogleLogin}
          variant="outline"
          className="mb-8 w-full rounded-2xl py-4 text-text-primary"
        >
          <FcGoogle className="w-6 h-6" />
          <span>Continue with Google</span>
        </Button>

        <div className="relative flex items-center my-8">
          <div className="flex-grow border-t border-txt-secondary/20"></div>
          <span className="mx-4 text-[10px] font-black text-txt-secondary uppercase tracking-widest">or email</span>
          <div className="flex-grow border-t border-txt-secondary/20"></div>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl px-5 py-4 text-txt-primary"
            variant="filled"
            placeholder="name@company.com"
            autoComplete="email"
          />

          <Input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl px-5 py-4 pr-14 text-txt-primary"
            variant="filled"
            placeholder="••••••••"
            autoComplete="current-password"
            rightNode={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-txt-secondary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />

          <div className="text-right">
            <a href="/forgot-password" className="text-sm text-primary hover:underline font-semibold">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            isLoading={isPending}
            className="w-full rounded-2xl py-4 text-lg"
          >
            Log In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-txt-secondary">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-primary font-bold hover:underline">
            Sign up
          </a>
        </p>
      </Card>
    </section>
  );
};

export default LoginPage;
