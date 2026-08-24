import React from "react";
import { DemoProvider } from "@/context/demo-context";
import { CartProvider } from "@/context/CartContext";
import { DemoTopBar } from "@/components/demo/demo-top-bar";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <CartProvider storeSlug="demo">
        <div className="min-h-screen bg-[#080808] flex flex-col relative selection:bg-maroon-800 selection:text-white">
          <DemoTopBar />
          <main className="flex-1 relative">
            {children}
          </main>
        </div>
      </CartProvider>
    </DemoProvider>
  );
}
