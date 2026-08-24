"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, ArrowRight, RotateCcw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { user, verifyEmailOtp, resendEmailOtp } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Invalid Code", "Please enter the complete 6-digit verification code.");
      return;
    }

    setVerifying(true);
    try {
      const verifyEmail = email || user?.email || "";
      if (!verifyEmail) {
        toast.error("Verification Error", "Could not find email address to verify.");
        setVerifying(false);
        return;
      }
      await verifyEmailOtp(verifyEmail, code);
      toast.success(
        "Email Verified Successfully!",
        "Your account is verified. Continuing to plan selection..."
      );
      router.push("/choose-plan");
    } catch (err: any) {
      toast.error("Verification Failed", err.message || "Invalid or expired code.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    try {
      const verifyEmail = email || user?.email || "";
      if (!verifyEmail) {
        toast.error("Error", "Could not find email address to resend to.");
        return;
      }
      
      await resendEmailOtp(verifyEmail);
      setTimer(30);
      toast.success("Code Resent", `A new 6-digit verification code was sent to ${verifyEmail}.`);
    } catch (err: any) {
      toast.error("Resend Failed", err.message || "Failed to resend verification code. Please try again.");
    }
  };

  return (
    <div className="space-y-6 text-center font-body">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center mx-auto text-maroon-300 shadow-glow">
        <MailCheck className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-xl font-bold font-heading text-white tracking-tight">
          Verify your email address
        </h1>
        <p className="text-xs text-zinc-400 font-body leading-relaxed max-w-sm mx-auto">
          We&apos;ve sent a 6-digit verification code to{" "}
          <strong className="text-white font-mono">{user?.email || "your email"}</strong>.
          Enter the code below to activate your merchant account.
        </p>
      </div>

      {/* 6-Digit OTP Inputs */}
      <form onSubmit={handleVerify} className="space-y-6 pt-2">
        <div className="flex items-center justify-center gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl bg-white/5 border border-white/10 text-white focus:border-maroon-500 focus:bg-maroon-950/40 focus:ring-1 focus:ring-maroon-500 transition-all outline-none"
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full h-11 text-xs font-semibold uppercase tracking-wider shadow-glow"
          isLoading={verifying}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Verify & Continue
        </Button>
      </form>

      {/* Resend Code & Help */}
      <div className="pt-2 space-y-3 text-xs text-zinc-400 border-t border-white/10">
        <p className="flex items-center justify-center gap-1.5">
          Didn&apos;t receive the code?{" "}
          <button
            onClick={handleResend}
            disabled={timer > 0}
            className="text-maroon-400 hover:text-maroon-300 font-bold font-heading disabled:opacity-40 transition-colors inline-flex items-center gap-1"
          >
            {timer > 0 ? (
              <span>Resend in {timer}s</span>
            ) : (
              <>
                <RotateCcw className="w-3 h-3" /> Resend Code
              </>
            )}
          </button>
        </p>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 font-mono pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Verified Merchant Protection Active
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center p-8 text-sm text-zinc-400">
        Loading verification portal...
      </div>
    }>
      <VerifyEmailForm />
    </React.Suspense>
  );
}
