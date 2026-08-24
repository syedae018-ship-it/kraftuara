import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center w-full bg-inherit">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-maroon-500" />
        <p className="text-xs text-zinc-400 font-body animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
