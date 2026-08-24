"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await forgotPasswordAction(formData);

    setLoading(false);

    if (result.success) {
      setSent(true);
      toast.success("Reset Email Sent", result.message);
    } else {
      toast.error("Request Failed", result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-bold font-heading text-white tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-xs text-zinc-400 font-body">
          Enter your registered email address and we&apos;ll send you instructions to reset it.
        </p>
      </div>

      {sent ? (
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 text-center space-y-3">
          <p className="text-xs text-emerald-300 font-body leading-relaxed">
            If an account exists for that email, password reset instructions have been sent.
          </p>
          <Link href="/login">
            <Button variant="outline" size="sm" className="w-full">
              Return to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="owner@store.com"
            leftIcon={<Mail className="w-4 h-4 text-zinc-500" />}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 font-semibold text-xs tracking-wider uppercase"
            isLoading={loading}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send Reset Instructions
          </Button>
        </form>
      )}

      <div className="text-center text-xs text-zinc-400 font-body border-t border-white/10 pt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
