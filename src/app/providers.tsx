"use client";

import React, { useEffect } from "react";
import { DummyAuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Unregister legacy Service Workers that cause 404 Webpack chunk corruption
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      }).catch(() => {});
    }
  }, []);

  return (
    <DummyAuthProvider>
      {children}
      <ToastProvider />
    </DummyAuthProvider>
  );
}

export default Providers;
