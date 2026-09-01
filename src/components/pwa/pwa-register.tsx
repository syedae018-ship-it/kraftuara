"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Registration successful
        })
        .catch((err) => {
          console.warn("ServiceWorker registration skipped/failed:", err);
        });
    }
  }, []);

  return null;
}
