import React from "react";
import Link from "next/link";
import { Store, ArrowLeft, Eye, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center selection:bg-maroon-800 selection:text-white font-body relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-maroon-900/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-md space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center mx-auto text-white shadow-glow">
          <Store className="w-8 h-8 text-maroon-300" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-maroon-400">
            404 • Page Not Found
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Storefront Unavailable
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            The store or page you are looking for does not exist, has been moved, or is currently unpublished.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full border-white/10 text-xs"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Back to Home
            </Button>
          </Link>
          <Link href="/demo" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full text-xs shadow-glow"
              leftIcon={<Eye className="w-4 h-4" />}
            >
              Explore Live Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
