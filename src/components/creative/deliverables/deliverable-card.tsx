"use client";

import React from "react";
import { Deliverable } from "@/types/creative-mvp";
import { Download, HardDrive, Paperclip, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface DeliverableCardProps {
  deliverable: Deliverable;
  className?: string;
}

const providerConfig: Record<string, { label: string; bg: string }> = {
  s3: { label: "AWS S3", bg: "bg-amber-950/60 text-amber-300 border-amber-800/40" },
  r2: { label: "Cloudflare R2", bg: "bg-orange-950/60 text-orange-300 border-orange-800/40" },
  gdrive: { label: "Google Drive", bg: "bg-emerald-950/60 text-emerald-300 border-emerald-800/40" },
  supabase: { label: "Supabase Storage", bg: "bg-emerald-950/60 text-emerald-300 border-emerald-800/40" },
};

export function DeliverableCard({ deliverable, className }: DeliverableCardProps) {
  const provider = providerConfig[deliverable.provider] || providerConfig.s3;

  return (
    <div
      className={cn(
        "p-4 rounded-2xl bg-[#111111] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-body text-xs",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#151515] border border-white/10 flex items-center justify-center shrink-0 text-maroon-400">
          <HardDrive className="w-5 h-5" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h5 className="font-bold font-heading text-white truncate">{deliverable.filename}</h5>
            <Badge
              variant={deliverable.version === "final" ? "success" : "outline"}
              className="text-[10px] uppercase font-mono py-0 px-1.5"
            >
              {deliverable.version}
            </Badge>
          </div>
          <p className="text-[11px] text-zinc-400 truncate">{deliverable.description || "Digital asset render"}</p>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
            <span>Size: {deliverable.size}</span>
            <span>By: {deliverable.uploadedBy}</span>
            <span className={cn("px-1.5 py-0.5 rounded border text-[9px]", provider.bg)}>
              {provider.label}
            </span>
          </div>
        </div>
      </div>

      <a
        href={deliverable.url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-maroon-800 hover:bg-maroon-700 text-white font-bold font-heading text-xs transition-colors flex items-center justify-center gap-1.5 shadow-glow shrink-0 border border-maroon-600/40"
      >
        <Download className="w-3.5 h-3.5" /> Download
      </a>
    </div>
  );
}
