"use client";

import React from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface BuyNowButtonProps {
  productName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BuyNowButton({ productName, size = "md", className }: BuyNowButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        // In a real app, this would add to cart or checkout. For the demo, we show a toast/alert.
        if (typeof window !== "undefined") {
          toast.success("Added to Cart", `${productName} has been added to your cart.`);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold font-heading transition-all shadow-glow cursor-pointer select-none",
        "bg-maroon-800 hover:bg-maroon-700 text-white border border-maroon-600/40",
        size === "sm" && "px-3 py-1.5 rounded-xl text-xs h-9",
        size === "md" && "px-4 py-2.5 rounded-xl text-xs sm:text-sm",
        size === "lg" && "px-6 py-3.5 rounded-2xl text-sm sm:text-base h-11",
        className
      )}
    >
      <Package className="w-4 h-4 shrink-0" />
      <span>Buy Now</span>
    </button>
  );
}
