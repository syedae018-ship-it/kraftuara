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
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { StoreData } from "@/types/store";
import { getStoreBasePath } from "@/lib/urls";
import { formatCurrency } from "@/lib/utils";

export default function BloomCartPage({ store, isSubdomain = false }: { store: StoreData; isSubdomain?: boolean }) {
  const { cart } = useCart();
  const [placedOrder, setPlacedOrder] = React.useState<any | null>(null);
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
        {placedOrder ? (
          <div className="mx-auto max-w-md text-center py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-950/80 border border-green-700/50 rounded-2xl flex items-center justify-center text-green-400 mb-6 shadow-glow">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-bloom-foreground mb-2">Order Placed Successfully!</h1>
            <p className="text-xs text-bloom-muted mb-6">
              Your order has been recorded. Please click the button below to send your quotation details to the store owner on WhatsApp to finalize your purchase.
            </p>

            <div className="w-full p-4 bg-bloom-card border border-bloom-border rounded-xl mb-6 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-bloom-border/50 pb-2 mb-2">
                <span className="text-bloom-muted font-heading">Order ID:</span>
                <span className="font-semibold font-mono text-bloom-foreground">#{placedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between border-b border-bloom-border/50 pb-2 mb-2">
                <span className="text-bloom-muted font-heading">Total Amount:</span>
                <span className="font-semibold font-mono text-bloom-foreground">{formatCurrency(placedOrder.totalAmount)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-bloom-muted font-heading">Delivery Address:</span>
                <span className="font-medium text-bloom-foreground">{placedOrder.shippingAddress}</span>
              </div>
            </div>

            <a
              href={placedOrder.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 bg-bloom-primary text-bloom-primary-foreground hover:bg-bloom-primary/90 flex items-center justify-center gap-2 text-sm font-semibold rounded-lg transition-colors shadow-md"
            >
              <MessageCircle className="h-4 w-4" />
              Send on WhatsApp
            </a>

            <div className="text-center mt-6">
              <Link href={basePath || "/"} className="text-xs text-bloom-muted hover:underline">
                Return to Store Home
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
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
                <OrderSummary store={store} onOrderPlaced={setPlacedOrder} />
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
