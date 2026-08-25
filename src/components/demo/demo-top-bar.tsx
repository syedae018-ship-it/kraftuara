"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Store,
  ArrowRight,
} from "lucide-react";
import { useDemo } from "@/context/demo-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";

export function DemoTopBar() {
  const { cartItemCount, setCartOpen } = useDemo();

  return (
    <div className="sticky top-0 z-40 w-full bg-[#0a0a0b]/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl font-body">
      {/* Left Column: Live Status & Template Badge */}
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Badge variant="maroon" className="text-[10px] py-0.5 uppercase tracking-wider font-mono">
          Live Demo
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-300 font-body">
            Template: <strong className="text-white font-heading">Kraftaura Classic</strong>
          </span>
          <span className="text-[11px] text-zinc-500 hidden md:inline font-mono">
            • 6 Realistic Sample Products
          </span>
        </div>
      </div>

      {/* Right Column: Actions */}
      <div className="flex items-center gap-3">
        {/* Cart Drawer Trigger Button */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
          title="View Shopping Cart"
        >
          <ShoppingBag className="w-4 h-4 text-white" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-maroon-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono shadow-glow">
              {cartItemCount}
            </span>
          )}
        </button>

        {/* Back to Landing */}
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold border-white/10 hover:bg-white/5"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Website
          </Button>
        </Link>

        {/* Start Free CTA */}
        <Link href="/signup">
          <Button
            variant="primary"
            size="sm"
            className="h-8 text-xs font-semibold shadow-glow"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Start Free
          </Button>
        </Link>
      </div>
    </div>
  );
}
