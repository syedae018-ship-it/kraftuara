"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface WhatsAppButtonProps {
  phone?: string;
  productName: string;
  sku?: string;
  price: number;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function WhatsAppButton({
  phone = "+91 98765 43210",
  productName,
  sku,
  price,
  variant = "primary",
  size = "md",
  className,
}: WhatsAppButtonProps) {
  const sanitizedPhone = phone.replace(/[^0-9]/g, "");
  const message = `Hi! I would like to order *${productName}* ${sku ? `(SKU: ${sku})` : ""} priced at *${formatCurrency(price)}* from your catalog store.`;
  const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold font-heading transition-all shadow-glow cursor-pointer select-none",
        variant === "primary" && "bg-maroon-800 hover:bg-maroon-700 text-white border border-maroon-600/40",
        variant === "secondary" && "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50",
        variant === "outline" && "bg-transparent hover:bg-white/5 text-white border border-white/20",
        size === "sm" && "px-3 py-1.5 rounded-xl text-xs",
        size === "md" && "px-4 py-2.5 rounded-xl text-xs sm:text-sm",
        size === "lg" && "px-6 py-3.5 rounded-2xl text-sm sm:text-base",
        className
      )}
    >
      <MessageSquare className="w-4 h-4 shrink-0" />
      <span>Order on WhatsApp</span>
    </a>
  );
}
