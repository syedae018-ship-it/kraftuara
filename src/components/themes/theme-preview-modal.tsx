"use client";

import React, { useState } from "react";
import { Theme } from "@/types/theme";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThemePreviewModalProps {
  theme: Theme | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyTheme: (id: string) => void;
}

export function ThemePreviewModal({ theme, isOpen, onClose, onApplyTheme }: ThemePreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  if (!theme) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Theme Preview: ${theme.name}`}
      description={theme.description}
      maxWidth="2xl"
      footer={
        <>
          <div className="flex items-center bg-[#111111] border border-white/10 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
                device === "desktop" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice("tablet")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
                device === "tablet" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <Tablet className="w-3.5 h-3.5" /> Tablet
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-heading font-medium",
                device === "mobile" ? "bg-maroon-800 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close Preview
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onApplyTheme(theme.id);
                onClose();
              }}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Apply This Theme
            </Button>
          </div>
        </>
      }
    >
      <div className="flex justify-center p-4 bg-[#050505] min-h-[500px]">
        <div
          className={cn(
            "transition-all duration-300 rounded-2xl overflow-hidden border border-white/10 bg-[#080808] shadow-2xl p-4 flex flex-col justify-between my-auto",
            device === "mobile" && "w-[375px] h-[600px]",
            device === "tablet" && "w-[768px] h-[650px]",
            device === "desktop" && "w-full max-w-5xl h-[650px]"
          )}
        >
          <img src={theme.previewImages[0] || theme.thumbnail} alt={theme.name} className="w-full h-full object-cover rounded-xl" />
        </div>
      </div>
    </Modal>
  );
}
