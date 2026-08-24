"use client";

import React from "react";
import { getBloomThemeStyles, getBloomFontsLink } from "../home/BloomStorefront";
import Link from "next/link";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import CartItemList from "./CartItemList";
import EmptyCart from "./EmptyCart";
import OrderSummary from "./OrderSummary";
import Recommendations from "./Recommendations";
import { Button } from "../ui/button";
import { useCart } from "@/context/CartContext";
import { ArrowLeft } from "lucide-react";
import { StoreData } from "@/types/store";
import { getStoreBasePath } from "@/lib/urls";

export default function BloomCartPage({ store, isSubdomain = false }: { store: StoreData; isSubdomain?: boolean }) {
  const { cart } = useCart();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const basePath = getStoreBasePath(store.slug, isSubdomain);

  const fontsLink = getBloomFontsLink(store.appearance.typography);

  return (
    <div
      className="bloom-theme min-h-screen flex flex-col justify-between antialiased bg-bloom-background text-bloom-foreground"
      style={getBloomThemeStyles(store.appearance.colors, store.appearance.typography)}
    >
      {fontsLink && (
        <link rel="stylesheet" href={fontsLink} />
      )}
      <Header store={store} isSubdomain={isSubdomain} />

      <main className="flex-grow bg-bloom-background container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cart.length === 0 ? (
          <EmptyCart storeSlug={store.slug} isSubdomain={isSubdomain} />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-bloom-foreground font-heading">Shopping Cart</h1>
                <p className="text-bloom-muted mt-2 font-mono text-sm">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
                </p>
              </div>

              <Button
                variant="ghost"
                asChild
                className="text-bloom-muted hover:text-bloom-foreground border-0"
              >
                <Link href={basePath || "/"} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <CartItemList />
              </div>

              <div className="lg:col-span-1">
                <OrderSummary store={store} />
              </div>
            </div>

            <Recommendations storeSlug={store.slug} isSubdomain={isSubdomain} />
          </div>
        )}
      </main>

      <Footer store={store} isSubdomain={isSubdomain} />
    </div>
  );
}
