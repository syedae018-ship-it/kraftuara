"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { useDemo } from "@/context/demo-context";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    cartItemCount,
  } = useDemo();

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = () => {
    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      toast.success(
        "Demo Order Placed!",
        "This demonstrates direct checkout order capture on live merchant stores."
      );
      clearCart();
      setCartOpen(false);
    }, 1000);
  };

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#111111] border-l border-white/10 text-white p-6 shadow-2xl overflow-y-auto font-body transition-transform duration-300 flex flex-col justify-between",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-maroon-900/60 border border-maroon-600/40 text-maroon-300">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-white">
                  Your Shopping Cart
                </h3>
                <span className="text-xs text-zinc-400 font-mono">
                  {cartItemCount} {cartItemCount === 1 ? "Item" : "Items"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-600 mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-zinc-400 font-heading">
                  Your cart is currently empty
                </p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Add items from the store catalog to test direct instant checkout.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const coverImage =
                  item.product.images.find((img) => img.isCover) ||
                  item.product.images[0];

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-[#151515] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {coverImage ? (
                          <img
                            src={coverImage.url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-zinc-600" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold font-heading text-white line-clamp-1">
                          {item.product.name}
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-400 block">
                          {formatCurrency(item.product.price)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-[#151515] border border-white/10 rounded-xl p-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono px-1.5 text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Subtotal & Checkout */}
        {cart.length > 0 && (
          <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="space-y-1.5 text-xs font-body">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono text-white font-semibold">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Estimated Shipping</span>
                <span className="font-mono text-emerald-400">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-bold font-heading text-white pt-2 border-t border-white/5">
                <span>Total</span>
                <span className="font-mono text-white">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              variant="primary"
              isLoading={checkoutLoading}
              className="w-full h-11 text-xs uppercase tracking-wider font-semibold shadow-glow"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Order (Demo)
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Direct Merchant WhatsApp & Checkout Enabled
            </div>
          </div>
        )}
      </div>
    </>
  );
}
