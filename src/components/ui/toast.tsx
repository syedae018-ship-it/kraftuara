"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastItem } from "@/types";
import { cn } from "@/lib/utils";

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const variantStyles: Record<string, { border: string; bg: string; icon: React.ReactNode; text: string }> = {
  default: {
    border: "border-white/10",
    bg: "bg-[#151515]/95",
    icon: <Info className="w-5 h-5 text-zinc-400 shrink-0" />,
    text: "text-white",
  },
  success: {
    border: "border-emerald-500/20",
    bg: "bg-[#151515]/95",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    text: "text-white",
  },
  error: {
    border: "border-maroon-600/40",
    bg: "bg-[#151515]/95",
    icon: <AlertCircle className="w-5 h-5 text-maroon-400 shrink-0" />,
    text: "text-white",
  },
  warning: {
    border: "border-amber-500/20",
    bg: "bg-[#151515]/95",
    icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    text: "text-white",
  },
  info: {
    border: "border-blue-500/20",
    bg: "bg-[#151515]/95",
    icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    text: "text-white",
  },
};

function ToastSingle({ toast: item, onDismiss }: ToastProps) {
  const variant = variantStyles[item.variant || "default"] || variantStyles.default;

  useEffect(() => {
    if (item.duration && item.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(item.id);
      }, item.duration);
      return () => clearTimeout(timer);
    }
  }, [item, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-xl p-4 shadow-xl backdrop-blur-md border",
        variant.bg,
        variant.border
      )}
    >
      {variant.icon}
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className={cn("text-xs font-semibold tracking-wide font-heading", variant.text)}>
          {item.title}
        </h4>
        {item.description && (
          <div className="text-xs text-zinc-400 font-body mt-1 leading-relaxed">
            {item.description}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-white/5 shrink-0"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="sync">
        {toasts.map((t) => (
          <ToastSingle key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
