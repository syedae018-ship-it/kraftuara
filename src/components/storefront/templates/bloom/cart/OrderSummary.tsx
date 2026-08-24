"use client";

import React, { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { useCart } from "@/context/CartContext";
import { Heart, MessageCircle, Shield, Truck, Loader2, AlertTriangle } from "lucide-react";
import { StoreData } from "@/types/store";
import { formatCurrency } from "@/lib/utils";
import { createOrderAction } from "@/lib/actions/order";
import { toast } from "@/hooks/use-toast";
import { trackClientEvent } from "@/components/storefront/storefront-tracker";

export default function OrderSummary({ store }: { store: StoreData }) {
  const { cart, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Free shipping threshold: ₹999
  const shippingThreshold = 999;
  const shippingCost = 99;
  const shipping = subtotal >= shippingThreshold ? 0 : shippingCost;
  const total = subtotal + shipping;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Resolve merchant WhatsApp number from database (never from client, never hardcoded)
  const merchantWhatsApp = store.appearance?.branding?.whatsapp?.trim() || "";
  const merchantPhone = store.appearance?.branding?.phone?.trim() || "";
  const hasWhatsApp = !!(merchantWhatsApp || merchantPhone);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Cart is empty", "Add products to your cart before checking out.");
      return;
    }

    if (!hasWhatsApp) {
      toast.error(
        "WhatsApp not configured",
        "The store owner has not yet configured a WhatsApp number. Please contact them directly."
      );
      return;
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      toast.error("Invalid Name", "Please enter your full name (minimum 2 characters).");
      return;
    }

    const cleanPhone = customerPhone.replace(/[^0-9+]/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      toast.error("Invalid Phone", "Please enter a valid phone number.");
      return;
    }

    if (!addressLine.trim() || addressLine.trim().length < 5) {
      toast.error("Address Required", "Please enter your street address.");
      return;
    }

    if (!city.trim()) {
      toast.error("City Required", "Please enter your city.");
      return;
    }

    if (!state.trim()) {
      toast.error("State Required", "Please enter your state.");
      return;
    }

    if (!pinCode.trim() || !/^\d{4,10}$/.test(pinCode.trim())) {
      toast.error("PIN Code Required", "Please enter a valid PIN/postal code.");
      return;
    }

    const fullAddress = `${addressLine.trim()}, ${city.trim()}, ${state.trim()} - ${pinCode.trim()}`;

    setIsSubmitting(true);

    try {
      // Create server-verified order (server re-reads product prices from DB)
      const orderItems = cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const response = await createOrderAction(
        store.id,
        {
          name: customerName.trim(),
          phone: cleanPhone,
          shippingAddress: fullAddress,
        },
        orderItems
      );

      if (!response.success || !response.order) {
        toast.error("Order Failed", response.error || "Could not place order.");
        setIsSubmitting(false);
        return;
      }

      const order = response.order;
      trackClientEvent(store.id, "order_conversion");

      // Use merchant's configured WhatsApp — never the customer's phone, never hardcoded
      const destinationNumber = (merchantWhatsApp || merchantPhone).replace(/[^0-9]/g, "");

      const cartItemsText = order.items
        ?.map(
          (item, idx) =>
            `${idx + 1}. *${item.productName}* × ${item.quantity} — ${formatCurrency(item.price * item.quantity)}`
        )
        .join("\n") || "";

      const notesSection = customerNotes.trim()
        ? `\n*Notes / Instructions:*\n${customerNotes.trim()}\n`
        : "";

      const message =
        `🛍️ *NEW ORDER — ${store.name}*\n` +
        `Order #: *${order.orderNumber}*\n\n` +
        `*Items:*\n` +
        `${cartItemsText}\n\n` +
        `Subtotal: ${formatCurrency(subtotal)}\n` +
        `Shipping: ${shipping === 0 ? "Free" : formatCurrency(shipping)}\n` +
        `*Total: ${formatCurrency(total)}*\n\n` +
        `*Customer:*\n` +
        `Name: ${order.customerName}\n` +
        `Phone: ${order.customerPhone}\n` +
        `Delivery Address: ${order.shippingAddress}\n` +
        `${notesSection}\n` +
        `Please confirm this order. Thank you!`;

      const whatsappUrl = `https://wa.me/${destinationNumber}?text=${encodeURIComponent(message)}`;

      // Reset form and clear cart
      setCustomerName("");
      setCustomerPhone("");
      setAddressLine("");
      setCity("");
      setState("");
      setPinCode("");
      setCustomerNotes("");
      clearCart();

      toast.success("Order Placed!", `Order #${order.orderNumber} confirmed. Opening WhatsApp...`);
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        }
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "w-full h-9 bg-bloom-background border border-bloom-border rounded-lg px-3 text-xs text-bloom-foreground outline-none focus:border-bloom-primary transition-all font-body placeholder:text-zinc-500 disabled:opacity-50";

  return (
    <Card className="sticky top-4 border-bloom-border bg-bloom-card text-bloom-foreground">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-heading">Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* WhatsApp not configured warning */}
        {!hasWhatsApp && (
          <div className="flex items-start gap-2 text-sm text-yellow-600/80 bg-yellow-500/10 p-3 rounded-lg mt-4">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>WhatsApp ordering isn&apos;t configured for this store yet. Contact the store owner directly.</span>
          </div>
        )}

        <form onSubmit={handleCheckout} className="space-y-4">
          {/* Price breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-bloom-muted">Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
              <span className="font-medium font-mono">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-bloom-muted">Shipping</span>
              <span className="font-medium font-mono">
                {shipping === 0 ? (
                  <Badge variant="secondary" className="text-xs bg-green-950/80 border border-green-700/50 text-green-400 font-mono">
                    Free
                  </Badge>
                ) : (
                  formatCurrency(shipping)
                )}
              </span>
            </div>

            <Separator className="bg-bloom-border" />

            <div className="flex justify-between">
              <span className="text-lg font-semibold font-heading">Total</span>
              <span className="text-lg font-bold text-bloom-primary font-mono">{formatCurrency(total)}</span>
            </div>
          </div>

          {shipping > 0 && (
            <div className="p-3 bg-bloom-accent/20 rounded-lg border border-bloom-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-bloom-primary shrink-0" />
                <span className="text-xs font-semibold text-bloom-primary">
                  Free shipping on orders over {formatCurrency(shippingThreshold)}
                </span>
              </div>
              <p className="text-[10px] text-bloom-muted">
                Add {formatCurrency(shippingThreshold - subtotal)} more to qualify!
              </p>
            </div>
          )}

          <Separator className="bg-bloom-border" />

          {/* Delivery Information Form */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-bloom-primary uppercase tracking-wider font-heading">
              Delivery Information
            </h4>
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-bloom-muted block mb-1 font-heading">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Riya Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={isSubmitting}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="text-[10px] text-bloom-muted block mb-1 font-heading">Your Phone Number *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={isSubmitting}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="text-[10px] text-bloom-muted block mb-1 font-heading">Street Address *</label>
                <input
                  type="text"
                  autoComplete="street-address"
                  required
                  placeholder="Building / Street / Area"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  disabled={isSubmitting}
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-bloom-muted block mb-1 font-heading">City *</label>
                  <input
                    type="text"
                    autoComplete="address-level2"
                    required
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isSubmitting}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-bloom-muted block mb-1 font-heading">State *</label>
                  <input
                    type="text"
                    autoComplete="address-level1"
                    required
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={isSubmitting}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-bloom-muted block mb-1 font-heading">PIN / Postal Code *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  required
                  placeholder="e.g. 400001"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  disabled={isSubmitting}
                  className={fieldClass}
                  maxLength={10}
                />
              </div>

              <div>
                <label className="text-[10px] text-bloom-muted block mb-1 font-heading">
                  Order Notes / Instructions (Optional)
                </label>
                <textarea
                  placeholder="e.g. Ring doorbell, special packaging, color/size preference..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  disabled={isSubmitting}
                  rows={2}
                  className="w-full bg-bloom-background border border-bloom-border rounded-lg p-2.5 text-xs text-bloom-foreground outline-none focus:border-bloom-primary transition-all font-body placeholder:text-zinc-500 disabled:opacity-50 resize-none"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || cart.length === 0 || !hasWhatsApp}
            className="w-full bg-bloom-primary text-bloom-primary-foreground hover:bg-bloom-primary/90 flex items-center justify-center gap-2 text-sm font-semibold h-11 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Order...
              </>
            ) : !hasWhatsApp ? (
              <>
                <MessageCircle className="h-4 w-4" />
                WhatsApp Ordering Unavailable
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Place WhatsApp Order
              </>
            )}
          </Button>
        </form>

        {/* Trust signals */}
        <div className="space-y-2 pt-3 border-t border-bloom-border">
          <div className="flex items-center gap-3 text-[11px] text-bloom-muted">
            <Shield className="h-4 w-4 text-green-500 shrink-0" />
            <span>Order placed directly with merchant via WhatsApp</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-bloom-muted">
            <Heart className="h-4 w-4 text-red-500 shrink-0" />
            <span>Server-verified prices — no price manipulation possible</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
