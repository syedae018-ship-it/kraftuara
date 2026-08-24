import React from "react";
import { DemoProvider } from "@/context/demo-context";
import { DemoTopBar } from "@/components/demo/demo-top-bar";
import { LiveCustomizationPanel } from "@/components/demo/live-customization-panel";
import { CartDrawer } from "@/components/demo/cart-drawer";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <div className="min-h-screen bg-[#080808] flex flex-col relative selection:bg-maroon-800 selection:text-white">
        <DemoTopBar />
        <main className="flex-1 relative">
          {children}
        </main>
        <LiveCustomizationPanel />
        <CartDrawer />
      </div>
    </DemoProvider>
  );
}
