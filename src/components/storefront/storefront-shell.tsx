"use client";

import React from "react";
import { CartProvider } from "@/context/CartContext";
import dynamic from "next/dynamic";

const StorefrontTracker = dynamic(
  () => import("@/components/storefront/storefront-tracker").then((m) => m.StorefrontTracker),
  { ssr: false }
);

interface StorefrontShellProps {
  children: React.ReactNode;
  storeSlug: string;
  storeId: string | null;
}

/**
 * Client-side shell for public storefronts.
 * Provides cart state and non-blocking analytics tracking without polluting the server layout.
 */
export function StorefrontShell({ children, storeSlug, storeId }: StorefrontShellProps) {
  return (
    <CartProvider storeSlug={storeSlug}>
      {storeId && <StorefrontTracker storeId={storeId} />}
      {children}
    </CartProvider>
  );
}
