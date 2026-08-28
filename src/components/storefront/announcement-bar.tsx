"use client";

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-950 border-b border-maroon-700/40 text-white text-xs font-body py-2 px-4 flex items-center justify-between text-center relative z-40">
      <div className="flex-1 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-maroon-300 shrink-0" />
        <span>
          Free worldwide express shipping on orders over <strong className="font-mono text-white">₹999</strong> • 100% Authentic Agarwood & Attars
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-zinc-400 hover:text-white transition-colors p-1"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
