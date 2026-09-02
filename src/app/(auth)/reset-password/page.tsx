"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      try {
        // 1. Check if PKCE code is present in URL
        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeErr) {
            if (mounted) {
              setHasValidSession(true);
              setIsSessionChecking(false);
            }
            return;
          }
        }

        // 2. Check if active session already exists (from /callback or hash)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (mounted) {
            setHasValidSession(true);
            setIsSessionChecking(false);
          }
          return;
        }

        // 3. Listen for hash fragment authentication (implicit recovery)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (session) {
              if (mounted) {
                setHasValidSession(true);
                setIsSessionChecking(false);
              }
            }
          }
        );

        // Allow up to 2 seconds for hash parsing on slow connections
        const timer = setTimeout(() => {
          if (mounted) {
            setIsSessionChecking(false);
          }
        }, 2000);

        return () => {
          clearTimeout(timer);
          subscription.unsubscribe();
        };
      } catch (err) {
        if (mounted) {
          setIsSessionChecking(false);
        }
      }
    }

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, [searchParams, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!password) {
      setErrorMessage("New password is required.");
      return;
    }

    if (!confirmPassword) {
      setErrorMessage("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message || "Failed to update password.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Password Updated", "Password updated successfully.");

      // Cleanly sign out recovery session
      await supabase.auth.signOut();

      // Automatically redirect to login after 2.5 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while resetting password.");
    } finally {
      setLoading(false);
    }
  };

  if (isSessionChecking) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-maroon-500" />
        <p className="text-xs text-zinc-400 font-body">Verifying secure recovery link...</p>
      </div>
    );
  }

  // If link is expired or accessed directly without session
  if (!hasValidSession && !success) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-glow">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold font-heading text-white tracking-tight">
            Invalid or Expired Link
          </h1>
          <p className="text-xs text-zinc-400 font-body leading-relaxed max-w-sm mx-auto">
            This password recovery link is invalid, has already been used, or has expired. Please request a new link.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/forgot-password">
            <Button variant="primary" className="w-full h-11 text-xs uppercase tracking-wider font-semibold shadow-glow">
              Request New Reset Link
            </Button>
          </Link>
        </div>

        <div className="pt-2 border-t border-white/10">
          <Link href="/login" className="text-xs text-zinc-400 hover:text-white font-body transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center mx-auto text-white shadow-glow mb-2">
          <Lock className="w-5 h-5 text-maroon-300" />
        </div>
        <h1 className="text-xl font-bold font-heading text-white tracking-tight">
          Reset your password
        </h1>
        <p className="text-xs text-zinc-400 font-body">
          Enter a new secure password for your merchant account
        </p>
      </div>

      {success ? (
        <div className="p-6 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-center space-y-4 font-body animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-emerald-900/40 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-heading">
              Password updated successfully.
            </h3>
            <p className="text-xs text-zinc-400">
              Your password has been changed. You will be redirected to the login screen shortly.
            </p>
          </div>
          <Link href="/login" className="block pt-2">
            <Button
              variant="primary"
              className="w-full h-10 text-xs font-semibold uppercase tracking-wider shadow-glow"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Continue to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <div className="relative">
              <Input
                label="New password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                leftIcon={<Lock className="w-4 h-4 text-zinc-500" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-zinc-500 hover:text-white transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Input
                label="Confirm new password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                leftIcon={<ShieldCheck className="w-4 h-4 text-zinc-500" />}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[34px] text-zinc-500 hover:text-white transition-colors"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 mt-2 font-semibold text-xs tracking-wider uppercase shadow-glow"
            isLoading={loading}
            disabled={loading}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Reset Password
          </Button>
        </form>
      )}

      <div className="text-center text-xs text-zinc-400 font-body border-t border-white/10 pt-4">
        <Link
          href="/login"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-6 h-6 border-2 border-maroon-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
