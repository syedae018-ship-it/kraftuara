"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const template = searchParams.get("template");
    if (template) {
      localStorage.setItem("symar_selected_template", template);
    }

    const expired = searchParams.get("expired");
    if (expired === "true") {
      setIsSessionExpired(true);
      toast.error("Session Expired", "Your session has expired. Please log in again.");
    }

    const savedRemember = localStorage.getItem("symar_remember_me");
    if (savedRemember !== null) {
      setRememberMe(savedRemember === "true");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const newErrors: { [key: string]: string } = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const result = await login(email, password, rememberMe);

      toast.success("Login Successful", `Signed in as ${email}`);

      if (result.role === "admin") {
        router.push("/admin");
      } else if (!result.hasStores) {
        router.push("/choose-plan");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg = err.message || "Failed to sign in.";
      if (msg.toLowerCase().includes("email not confirmed")) {
        toast.error("Email Not Confirmed", "Please check your inbox or verify your email.");
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        toast.error("Sign In Failed", msg);
      }
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-bold font-heading text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs text-zinc-400 font-body">
          Enter your credentials to access your catalog stores
        </p>
      </div>

      {isSessionExpired && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Your session has expired. Please log in again to continue.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="owner@store.com"
            leftIcon={<Mail className="w-4 h-4 text-zinc-500" />}
          />
          {errors.email && <p className="text-[10px] text-red-500 mt-1 font-body">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <Input
            label="Password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4 text-zinc-500" />}
          />
          {errors.password && <p className="text-[10px] text-red-500 mt-1 font-body">{errors.password}</p>}
          <div className="flex justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-400 hover:text-maroon-400 font-body transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 py-1 select-none">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 accent-maroon-600 rounded bg-[#111111] border-white/10 cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-xs text-zinc-400 font-body cursor-pointer hover:text-white transition-colors">
            Remember Me (Keep me logged in for 8 days)
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full h-11 mt-2 font-semibold text-xs tracking-wider uppercase shadow-glow"
          isLoading={loading}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Login
        </Button>
      </form>

      <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
        <Link href="/signup" className="w-full">
          <Button
            variant="outline"
            className="w-full h-11 justify-center text-xs font-semibold uppercase tracking-wider border-white/10 hover:border-maroon-700"
          >
            Create Account
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-maroon-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
