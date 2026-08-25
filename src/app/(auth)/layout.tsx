import React from "react";
import { Sparkles, Store } from "lucide-react";
import { Badge } from "@/components/ui/table";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-maroon-800/80 font-body relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-maroon-900/20 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white shadow-glow mb-1">
            <Store className="w-6 h-6 text-white" />
          </div>
          <Badge variant="maroon" className="gap-1 text-[11px] font-brand uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-maroon-300" /> Kraftaura
          </Badge>
        </div>

        {/* Auth Form Card Wrapper */}
        <div className="bg-[#151515] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-500 font-body">
          Protected by Supabase Auth & Multi-Tenant Row Level Security.
        </p>
      </div>
    </div>
  );
}
