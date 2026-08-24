"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { QrCode, ShieldCheck, Copy, Check } from "lucide-react";

export default function AdminMfaSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enrollData, setEnrollData] = useState<{
    id: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function checkStatusAndEnroll() {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error || !data) {
          toast.error("MFA Error", "Unable to load authentication parameters.");
          router.push("/login");
          return;
        }

        // If verified factors exist, redirect to verify screen
        const factors = data.all || [];
        const verifiedFactor = factors.find((f: any) => f.status === "verified");
        if (verifiedFactor) {
          router.push("/login/mfa");
          return;
        }

        // Start enrollment
        const { data: enrollRes, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          issuer: "Symar Catalog",
          friendlyName: "Super Admin",
        });

        if (enrollError || !enrollRes) {
          throw new Error(enrollError?.message || "Failed to start MFA enrollment.");
        }

        setEnrollData({
          id: enrollRes.id,
          qrCode: enrollRes.totp.qr_code,
          secret: enrollRes.totp.secret,
        });
      } catch (err: any) {
        console.error("MFA Enrollment Error:", err);
        toast.error("Setup Error", err.message || "Failed to initialize authenticator.");
      }
    }
    checkStatusAndEnroll();
  }, [router, supabase]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;

    setLoading(true);

    try {
      // 1. Create Challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollData.id,
      });

      if (challengeError || !challengeData) {
        throw new Error(challengeError?.message || "Failed to create setup challenge.");
      }

      // 2. Verify code to activate the factor
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challengeData.id,
        code: code.trim(),
      });

      if (verifyError) {
        throw new Error(verifyError.message || "Code verification failed. Check the value and try again.");
      }

      toast.success("MFA Setup Complete", "Google Authenticator registered successfully.");
      router.push("/admin");
    } catch (err: any) {
      toast.error("Verification Failed", err.message || "Invalid setup verification code.");
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (!enrollData) return;
    navigator.clipboard.writeText(enrollData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Secret Copied", "Authenticator secret copied to clipboard.");
  };

  if (!enrollData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
        <div className="w-8 h-8 border-2 border-maroon-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 font-body">Provisioning dynamic security parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="space-y-1.5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white mx-auto shadow-glow mb-4">
          <QrCode className="w-5 h-5 text-maroon-300" />
        </div>
        <h1 className="text-xl font-bold font-heading text-white tracking-tight">
          Admin MFA Enrollment
        </h1>
        <p className="text-xs text-zinc-400 font-body">
          Scan this QR Code using Google Authenticator, Duo, or any TOTP application to configure MFA.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 flex flex-col items-center space-y-4">
        {/* QR Code SVG Image */}
        <div className="w-48 h-48 bg-white p-2.5 rounded-xl border border-white/20 flex items-center justify-center">
          <img
            src={enrollData.qrCode}
            alt="MFA QR Code"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Manual Setup Secret */}
        <div className="w-full space-y-1.5">
          <label className="text-[10px] text-zinc-400 block font-heading font-bold uppercase tracking-wider">
            Setup Secret Key (Manual Entry)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={enrollData.secret}
              className="flex-1 bg-[#080808] border border-white/5 rounded-lg px-3 py-2 text-[10px] text-zinc-300 font-mono select-all outline-none"
            />
            <Button
              type="button"
              variant="outline"
              onClick={copySecret}
              className="px-2.5 h-8 border-white/10"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Verify Code Form */}
      <form onSubmit={handleVerify} className="space-y-4 pt-2">
        <div className="space-y-2">
          <Input
            label="Verify 6-Digit Code"
            type="text"
            required
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            disabled={loading}
            leftIcon={<ShieldCheck className="w-4 h-4 text-zinc-500" />}
            className="text-center tracking-[0.5em] text-sm font-mono"
          />
          <p className="text-[10px] text-zinc-500 font-body text-center">
            Confirm setup by entering the code generated by your app.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full h-11 mt-2 font-semibold text-xs tracking-wider uppercase shadow-glow"
          isLoading={loading}
        >
          Verify and Activate MFA
        </Button>
      </form>
    </div>
  );
}
