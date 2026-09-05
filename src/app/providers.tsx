"use client";

import React, { useEffect } from "react";
import { DummyAuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DummyAuthProvider>
      {children}
      <ToastProvider />
    </DummyAuthProvider>
  );
}

export default Providers;
