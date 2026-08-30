"use client";

import React, { useState } from "react";
import { Theme } from "@/types/theme";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_STORE_DATA } from "@/lib/demo-data";
import { CartProvider } from "@/context/CartContext";
import BloomStorefront from "@/components/storefront/templates/bloom/home/BloomStorefront";
import {
  ResponsiveViewportFrame,
  DeviceType,
} from "@/components/appearance/responsive-viewport-frame";
import { StoreData } from "@/types/store";

export interface ThemePreviewModalProps {
  theme: Theme | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyTheme: (id: string) => void;
}

export function ThemePreviewModal({ theme, isOpen, onClose, onApplyTheme }: ThemePreviewModalProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");

  if (!theme) return null;

  // Build simulated theme store data
  const themeStoreData: StoreData = {
    ...DEMO_STORE_DATA,
    appearance: {
      ...DEMO_STORE_DATA.appearance,
      themeId: theme.id,
    },
  };

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
      <div className="h-[520px] sm:h-[600px] w-full bg-[#050505] rounded-xl overflow-hidden relative border border-white/5">
        <ResponsiveViewportFrame
          device={device}
          className={cn(
            "flex flex-col bg-black shadow-2xl transition-all duration-300",
            device === "mobile" && "rounded-[36px] border-[6px] border-[#222222] overflow-hidden",
            device === "tablet" && "rounded-[20px] border-[4px] border-[#222222] overflow-hidden",
            device === "desktop" && "rounded-xl border border-white/10 overflow-hidden"
          )}
        >
          <CartProvider storeSlug={themeStoreData.slug}>
            <div className="w-full h-full overflow-x-hidden">
              <BloomStorefront store={themeStoreData} isSubdomain={false} />
            </div>
          </CartProvider>
        </ResponsiveViewportFrame>
      </div>
    </Modal>
  );
}
