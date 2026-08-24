"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Lock } from "lucide-react";

export default function AdminMfaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function getFactors() {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error || !data) {
          toast.error("MFA Error", "Unable to load authentication parameters.");
          router.push("/login");
          return;
        }

        // Find verified TOTP factors
        const factors = data.all || [];
        const verifiedFactor = factors.find((f: any) => f.status === "verified");

        if (!verifiedFactor) {
          router.push("/login/mfa-setup");
          return;
        }

        setFactorId(verifiedFactor.id);
      } catch (err) {
        console.error("Failed to load factors:", err);
      }
    }
    getFactors();
  }, [router, supabase]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;

    setLoading(true);

    try {
      // 1. Create Challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError || !challengeData) {
        throw new Error(challengeError?.message || "Failed to initiate MFA challenge.");
      }

      // 2. Verify Code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      });

      if (verifyError) {
        throw new Error(verifyError.message || "Invalid authentication code. Please try again.");
      }

      toast.success("MFA Verified", "Access granted to Super Admin panel.");
      router.push("/admin");
    } catch (err: any) {
      toast.error("Verification Failed", err.message || "Invalid code.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <div className="space-y-1.5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white mx-auto shadow-glow mb-4 animate-pulse">
          <Lock className="w-5 h-5 text-maroon-300" />
        </div>
        <h1 className="text-xl font-bold font-heading text-white tracking-tight">
          Admin MFA Verification
        </h1>
        <p className="text-xs text-zinc-400 font-body">
          Enter the 6-digit verification code from your Google Authenticator app.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <Input
            label="MFA Authenticator Code"
            type="text"
            required
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            disabled={loading}
            leftIcon={<ShieldCheck className="w-4 h-4 text-zinc-500" />}
            className="text-center tracking-[0.5em] text-lg font-mono"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full h-11 mt-2 font-semibold text-xs tracking-wider uppercase shadow-glow"
          isLoading={loading}
        >
          Verify Code
        </Button>
      </form>
    </div>
  );
}
