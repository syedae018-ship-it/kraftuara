"use client";

import React, { useState, useEffect } from "react";
import { getStorePublishStatusAction, publishStoreChangesAction } from "@/lib/actions/store";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PublishStatusBadgeProps {
  storeId?: string;
  className?: string;
  showRetry?: boolean;
  onPublishSuccess?: () => void;
}

export function PublishStatusBadge({
  storeId,
  className,
  showRetry = true,
  onPublishSuccess,
}: PublishStatusBadgeProps) {
  const [status, setStatus] = useState<string>("PUBLISHED");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    let isMounted = true;
    async function loadStatus() {
      try {
        const res = await getStorePublishStatusAction(storeId!);
        if (isMounted && res.success && res.data) {
          setStatus(res.data.status);
        }
      } catch {
        // Fallback default
      }
    }

    loadStatus();
    return () => {
      isMounted = false;
    };
  }, [storeId]);

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!storeId || isPublishing) return;

    setIsPublishing(true);
    setStatus("PUBLISHING");
    try {
      const res = await publishStoreChangesAction(storeId);
      if (res.success) {
        setStatus("PUBLISHED");
        toast.success("Synchronized!", "Store changes are now live.");
        onPublishSuccess?.();
      } else {
        setStatus("SYNC_REQUIRED");
        toast.error("Sync Failed", res.error || "Could not publish changes.");
      }
    } catch {
      setStatus("SYNC_REQUIRED");
      toast.error("Error", "Failed to synchronize store.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isPublishing || status === "PUBLISHING") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/50 animate-pulse",
          className
        )}
      >
        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
        <span>Publishing...</span>
      </div>
    );
  }

  if (status === "SYNC_REQUIRED" || status === "PUBLISH_FAILED") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-amber-950/70 text-amber-300 border border-amber-700/60",
          className
        )}
      >
        <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
        <span>Sync Required</span>
        {showRetry && (
          <button
            type="button"
            onClick={handleRetry}
            className="ml-1 px-1.5 py-0.5 rounded bg-amber-900/80 hover:bg-amber-800 text-amber-100 text-[9px] font-bold flex items-center gap-0.5 transition-colors"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 shadow-sm",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span>Live Store</span>
    </div>
  );
}
