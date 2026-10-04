"use client";

import React, { useState } from "react";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { StoreData } from "@/types/store";
import { getBloomThemeStyles, getBloomFontsLink } from "../home/BloomStorefront";
import { trackOrderAction } from "@/lib/actions/order";
import { Button } from "../ui/button";
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  AlertCircle,
  XCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface BloomTrackOrderPageProps {
  store: StoreData;
  isSubdomain?: boolean;
  initialOrderId?: string;
}

const ORDER_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock, desc: "Received by merchant" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, desc: "Order verified" },
  { key: "processing", label: "Processing", icon: Package, desc: "Being packed" },
  { key: "shipped", label: "Shipped", icon: Truck, desc: "Out for delivery" },
  { key: "delivered", label: "Delivered", icon: Check, desc: "Fulfilled" },
];

export default function BloomTrackOrderPage({
  store,
  isSubdomain = false,
  initialOrderId = "",
}: BloomTrackOrderPageProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderId);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const themeStyles = getBloomThemeStyles(store.appearance);
  const fontsLink = getBloomFontsLink(store.appearance.typography);

  const fetchTracking = async (idToSearch: string) => {
    if (!idToSearch.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setTrackingData(null);

    try {
      const res = await trackOrderAction(store.slug, idToSearch.trim());
      if (res.success && res.order) {
        setTrackingData(res.order);
      } else {
        setErrorMessage(res.error || "We couldn't find an order with that ID.");
      }
    } catch {
      setErrorMessage("Unable to retrieve order details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialOrderId && initialOrderId.trim()) {
      fetchTracking(initialOrderId.trim());
    }
  }, [initialOrderId]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderNumber);
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    if (currentStatus === "cancelled") return "cancelled";
    const statusOrder = ["pending", "confirmed", "processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus.toLowerCase());
    const stepIndex = statusOrder.indexOf(stepKey);

    if (currentIndex === -1) {
      return stepIndex === 0 ? "current" : "upcoming";
    }

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const merchantWhatsApp = store.appearance?.branding?.whatsapp?.replace(/[^0-9]/g, "") || "";

  return (
    <div
      style={{
        ...themeStyles,
        backgroundColor: "var(--color-background)",
        fontFamily: "var(--font-body)",
      }}
      className="bloom-theme min-h-screen flex flex-col bg-bloom-background text-bloom-foreground antialiased selection:bg-bloom-primary/20"
    >
      {fontsLink && <link rel="stylesheet" href={fontsLink} />}

      <Header store={store} isSubdomain={isSubdomain} />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 max-w-4xl w-full">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-bloom-accent text-bloom-primary">
            <Package className="w-3.5 h-3.5" /> Order Tracking
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-bloom-foreground">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-bloom-muted px-2">
            Enter your Kraftaura Order ID (e.g. #KA1024 or KRA-8F42X91) to view real-time fulfillment and delivery status.
          </p>
        </div>

        {/* Tracking Search Form */}
        <form onSubmit={handleTrack} className="max-w-xl mx-auto mb-8 sm:mb-12 w-full">
          <div className="flex flex-col sm:flex-row gap-2 p-1.5 sm:p-2 bg-bloom-secondary rounded-2xl border border-bloom-border shadow-sm">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-3.5 sm:top-3 h-4 w-4 text-bloom-muted" />
              <input
                type="text"
                required
                placeholder="Enter Order ID (e.g. #KA1024)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                className="w-full h-11 sm:h-10 pl-10 pr-3 bg-transparent text-sm text-bloom-foreground outline-none font-mono uppercase placeholder:normal-case placeholder:font-body placeholder:text-bloom-muted"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !orderNumber.trim()}
              className="h-11 sm:h-10 px-6 w-full sm:w-auto shrink-0 bg-bloom-primary text-bloom-primary-foreground hover:bg-bloom-primary/90 rounded-xl text-xs font-semibold uppercase tracking-wider shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </span>
              ) : (
                "Track Order"
              )}
            </Button>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Tracking Results Card */}
        {trackingData && (
          <div className="bg-bloom-secondary/60 border border-bloom-border rounded-3xl p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 shadow-sm w-full overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-bloom-border">
              <div>
                <span className="text-[10px] sm:text-xs text-bloom-muted font-heading uppercase tracking-wider block">Order ID</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-bloom-foreground break-all">{trackingData.orderNumber}</span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] sm:text-xs text-bloom-muted font-heading uppercase tracking-wider block">Placed On</span>
                <span className="text-xs sm:text-xs font-mono text-bloom-foreground">
                  {new Date(trackingData.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-heading uppercase tracking-wider text-bloom-primary">
                  Fulfillment Timeline
                </h3>
                <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-bloom-accent text-bloom-primary font-mono">
                  {trackingData.status}
                </span>
              </div>

              {trackingData.status === "cancelled" ? (
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-400 flex items-center gap-3">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-semibold block text-sm">Order Cancelled</span>
                    <span className="text-xs text-rose-300/80">This order has been cancelled by the merchant.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-3 pt-2">
                  {ORDER_STEPS.map((step) => {
                    const status = getStepStatus(step.key, trackingData.status);
                    const isCompleted = status === "completed";
                    const isCurrent = status === "current";
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.key}
                        className={cn(
                          "p-3 sm:p-4 rounded-2xl border transition-all flex flex-row sm:flex-col items-center sm:text-center sm:justify-between gap-3 sm:gap-2 min-h-[58px] sm:min-h-[110px]",
                          isCompleted && "bg-green-950/20 border-green-500/30 text-green-400",
                          isCurrent && "bg-bloom-accent border-bloom-primary text-bloom-primary shadow-sm ring-1 ring-bloom-primary/30",
                          status === "upcoming" && "bg-bloom-background/40 border-bloom-border/40 text-bloom-muted opacity-60"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 sm:mb-2",
                          isCompleted && "bg-green-500/20 text-green-400",
                          isCurrent && "bg-bloom-primary text-bloom-primary-foreground",
                          status === "upcoming" && "bg-bloom-secondary text-bloom-muted"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 text-left sm:text-center min-w-0 flex-1">
                          <span className="text-xs font-bold font-heading block truncate">{step.label}</span>
                          <span className="text-[10px] text-bloom-muted block truncate">{step.desc}</span>
                        </div>
                        {/* Mobile status indicator */}
                        <div className="sm:hidden shrink-0">
                          {isCompleted && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-semibold">Done</span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-bloom-primary/20 text-bloom-primary font-semibold">Current</span>
                          )}
                          {status === "upcoming" && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-500">Upcoming</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Items Summary */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold font-heading uppercase tracking-wider text-bloom-primary">
                Order Items ({trackingData.items?.length || 0})
              </h3>
              <div className="divide-y divide-bloom-border/60 bg-bloom-background rounded-2xl border border-bloom-border overflow-hidden">
                {trackingData.items?.map((item: any, i: number) => (
                  <div key={i} className="p-3 sm:p-3.5 flex justify-between items-center text-xs gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-bloom-foreground block truncate">{item.productName}</span>
                      <span className="text-[10px] text-bloom-muted font-mono">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-mono font-medium text-bloom-foreground shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Need assistance footer */}
            {merchantWhatsApp && (
              <div className="p-4 rounded-2xl bg-bloom-background border border-bloom-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-bloom-muted text-center sm:text-left text-xs">
                  Have questions about this order? Contact the store owner directly.
                </span>
                <a
                  href={`https://wa.me/${merchantWhatsApp}?text=${encodeURIComponent(
                    `Hello, I am inquiring about my Order #${trackingData.orderNumber}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors shrink-0 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat on WhatsApp
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer store={store} isSubdomain={isSubdomain} />
    </div>
  );
}
