"use client";

import React from "react";
import { CartProvider } from "@/context/CartContext";
import { StorefrontTracker } from "@/components/storefront/storefront-tracker";

interface StorefrontShellProps {
  children: React.ReactNode;
  storeSlug: string;
  storeId: string | null;
}

/**
 * Client-side shell for public storefronts.
 * Provides cart state and analytics tracking without polluting the server layout.
 * Keeping all client providers here (not in layout.tsx) prevents the
 * Next.js 15 clientReferenceManifest invariant error.
 */
export function StorefrontShell({ children, storeSlug, storeId }: StorefrontShellProps) {
  return (
    <CartProvider storeSlug={storeSlug}>
      {storeId && <StorefrontTracker storeId={storeId} />}
      {children}
    </CartProvider>
  );
}
