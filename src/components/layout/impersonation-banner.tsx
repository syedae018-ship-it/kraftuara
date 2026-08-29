"use client";

import React, { useState, useEffect } from "react";
import { getImpersonationStatusAction, stopImpersonationAction } from "@/lib/actions/admin";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function ImpersonationBanner() {
  const [session, setSession] = useState<any | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      const res = await getImpersonationStatusAction();
      if (res.success && res.data) {
        setSession(res.data);
      }
    }
    checkStatus();
  }, []);

  const handleExit = async () => {
    setIsExiting(true);
    try {
      await stopImpersonationAction();
      toast.info("Exited Impersonation", "Returned to platform super admin control.");
      window.location.href = "/admin/users";
    } catch {
      window.location.href = "/admin";
    } finally {
      setIsExiting(false);
    }
  };

  if (!session) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black px-4 py-2 text-xs font-heading font-bold shadow-lg sticky top-0 z-50 flex items-center justify-between border-b border-black/10">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-black animate-pulse" />
        <span>
          ADMIN IMPERSONATION MODE: Viewing dashboard as{" "}
          <strong className="underline underline-offset-2">
            {session.targetUserName || session.targetUserEmail}
          </strong>{" "}
          ({session.targetStoreName || session.targetStoreSlug})
        </span>
      </div>

      <button
        type="button"
        onClick={handleExit}
        disabled={isExiting}
        className="px-3 py-1 bg-black text-white hover:bg-zinc-900 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
      >
        {isExiting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
        Exit Impersonation
      </button>
    </div>
  );
}
