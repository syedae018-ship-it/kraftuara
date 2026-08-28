"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PLANS, PlanTier } from "@/lib/feature-gating";

interface DisplayPlan {
  id: "startup" | "growth" | "pro";
  name: string;
  planName: string;
  price: string;
  amount: number;
  description: string;
  badge?: string;
  popular?: boolean;
  setupFee?: string;
  features: string[];
}

const planFeaturesDisplay = {
  startup: [
    "WhatsApp Catalog Order Buttons",
    "Basic Dashboard Overview",
    "Product Management (up to 10 products)",
    "Dedicated Storefront URL Link",
    "Kraftaura Classic template access",
    "Custom Logo Upload",
  ],
  growth: [
    "Everything in Startup Pack",
    "Product Management (up to 24 products)",
    "Store Analytics & Traffic Insights (Store Views)",
    "Curated Collections & Taxonomies",
    "Advanced Customization & Branding",
    "Creative discounts & promo codes",
  ],
  pro: [
    "Everything in Growth Pack",
    "Product Management (up to 100 products)",
    "Direct Razorpay Payment Gateway & Checkout",
    "Order Management & Customer Invoicing",
    "Shipping Integration & Tracking Labels",
    "Revenue Analytics & Sales Graphs",
    "Discount Coupons & Promotional Banners",
    "Real-time Inventory & Stock Alerts",
    "Custom Domain Mapping",
  ],
};

export default function ChoosePlanPage() {
  const router = useRouter();

  // Dynamically load Razorpay SDK checkout script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const { selectPlan, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<DisplayPlan | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Map PLANS configurations dynamically to match UI items
  const displayPlans: DisplayPlan[] = [
    {
      id: "startup",
      name: PLANS.startup.name,
      planName: "startup",
      price: `₹${PLANS.startup.priceMonthly}`,
      amount: PLANS.startup.priceMonthly,
      description: PLANS.startup.description,
      features: planFeaturesDisplay.startup,
    },
    {
      id: "growth",
      name: PLANS.growth.name,
      planName: "growth",
      price: `₹${PLANS.growth.priceMonthly}`,
      amount: PLANS.growth.priceMonthly,
      description: PLANS.growth.description,
      badge: "MOST POPULAR",
      popular: true,
      features: planFeaturesDisplay.growth,
    },
    {
      id: "pro",
      name: PLANS.pro.name,
      planName: "pro",
      price: `₹${PLANS.pro.priceMonthly}`,
      amount: PLANS.pro.priceMonthly,
      description: PLANS.pro.description,
      badge: "FULL E-COMMERCE",
      features: planFeaturesDisplay.pro,
    },
  ];

  const handleChoosePlan = async (plan: DisplayPlan) => {
    setSelectedPlan(plan);
    setProcessingPayment(true);

    try {
      const { createStoreSubscriptionAction } = await import("@/lib/actions/payment");
      const res = await createStoreSubscriptionAction(null, plan.planName as any);

      if (!res.success) {
        toast.error("Checkout Error", res.error || "Failed to initialize subscription checkout.");
        setProcessingPayment(false);
        return;
      }

      const { subscriptionId, keyId, isSimulated } = res.data;

      if (isSimulated) {
        toast.warning(
          "Test Mode Sandbox Simulation",
          "Sandbox environment fallback activated."
        );
        // Automatically simulate success in local development environment
        setTimeout(() => {
          const mockSubId = `sub_mock_${Date.now()}`;
          const mockPayId = `pay_mock_${Date.now()}`;
          const mockSig = `sig_mock_${Date.now()}`;
          
          selectPlan(plan.planName, "active");
          localStorage.setItem("symar_checkout_subscription_id", mockSubId);
          localStorage.setItem("symar_checkout_payment_id", mockPayId);
          localStorage.setItem("symar_checkout_signature", mockSig);

          toast.success(
            `${plan.name} Activated!`,
            `Payment verified. Continuing to template selection...`
          );
          router.push("/choose-template");
          setProcessingPayment(false);
        }, 1000);
        return;
      }

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "Kraftaura Catalog Platform",
        description: `${plan.name} Subscription`,
        image: "https://api.dicebear.com/7.x/initials/svg?seed=Kraftaura",
        handler: async function (response: any) {
          setProcessingPayment(true);
          const { verifySubscriptionPaymentAction } = await import("@/lib/actions/payment");
          const verRes = await verifySubscriptionPaymentAction({
            paymentId: response.razorpay_payment_id,
            subscriptionId: response.razorpay_subscription_id,
            signature: response.razorpay_signature,
            planId: plan.planName as any,
          });

          if (verRes.success) {
            const activePlan = verRes.data?.verifiedPlan || plan.planName;
            selectPlan(activePlan, "active");
            localStorage.setItem("symar_selected_plan", activePlan);
            localStorage.setItem("symar_checkout_subscription_id", response.razorpay_subscription_id);
            localStorage.setItem("symar_checkout_payment_id", response.razorpay_payment_id);
            localStorage.setItem("symar_checkout_signature", response.razorpay_signature);

            toast.success(
              `${PLANS[activePlan as PlanTier]?.name || plan.name} Activated!`,
              `Payment verified. Continuing to template selection...`
            );
            router.push("/choose-template");
          } else {
            toast.error("Signature Verification Failed", verRes.error || "Crypto verification mismatch.");
          }
          setProcessingPayment(false);
        },
        prefill: {
          email: user?.email || "",
        },
        theme: {
          color: "#800020",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (resp: any) {
        toast.error("Payment Failed", resp.error?.description || "Payment cancelled or rejected.");
        setProcessingPayment(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error("Checkout Launch Error", err.message || "Failed to load checkout.");
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-body relative overflow-hidden">
      {/* Subtle Ambient Red Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-maroon-900/15 blur-[160px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-5xl space-y-8 my-8 text-center">
        {/* Header Section */}
        <div className="space-y-3">
          <Badge variant="maroon" className="gap-1 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-maroon-300" /> Step 3 of 5 • Subscription & Plan Activation
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight text-white">
            Choose Your Platform Plan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Select the plan tailored for your business volume. Upgrade or downgrade anytime directly from your merchant dashboard.
          </p>
        </div>

        {/* Plans Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
          {displayPlans.map((plan) => {
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-6 shadow-2xl backdrop-blur-xl",
                  isPopular
                    ? "bg-[#111111] border-maroon-600/60 ring-1 ring-maroon-500/40 shadow-glow"
                    : "bg-[#111111]/90 border-white/10 hover:border-white/20"
                )}
              >
                {plan.badge && (
                  <span
                    className={cn(
                      "absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md border",
                      isPopular
                        ? "bg-maroon-800 text-white border-maroon-600"
                        : "bg-white/10 text-zinc-300 border-white/20"
                    )}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold font-heading text-white">{plan.name}</h3>
                    <p className="text-[11px] text-zinc-400 font-body mt-1 leading-relaxed">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-3xl font-extrabold font-heading text-white">
                        {plan.price}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">/ month</span>
                    </div>
                    {plan.setupFee && (
                      <p className="text-[10px] text-amber-500 font-mono mt-1 font-semibold">
                        + {plan.setupFee}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-white/5 text-[11px] text-zinc-300 font-body">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id !== "startup" && (
                    <div className="text-[9px] text-zinc-400 font-body text-center bg-white/5 p-2 rounded-xl border border-white/5 mt-2">
                      🎁 Includes a 3-Day Free Trial (requires automatic recurring authorization)
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleChoosePlan(plan)}
                  variant={isPopular ? "primary" : "outline"}
                  className={cn(
                    "w-full h-11 text-xs uppercase tracking-wider font-bold shadow-md mt-4",
                    isPopular ? "shadow-glow" : "border-white/10 hover:bg-white/5"
                  )}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Choose {plan.name}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Security & Activation Badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-zinc-500 font-mono pt-4">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Cancel Anytime</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-emerald-400" /> Instant Activation</span>
        </div>
      </div>

    </div>
  );
}
