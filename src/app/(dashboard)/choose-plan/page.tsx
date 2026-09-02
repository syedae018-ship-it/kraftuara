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
import { PLANS, PlanTier, BillingInterval, PlanConfig, getPlanDisplayName } from "@/lib/feature-gating";

interface DisplayPlan {
  id: PlanTier;
  name: string;
  planName: PlanTier;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  badge?: string;
  popular?: boolean;
  isTrialEligible?: boolean;
  features: string[];
}

export default function ChoosePlanPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [plans, setPlans] = useState<PlanConfig[]>([]);

  // Dynamically load Razorpay SDK checkout script and fetch latest plans
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    // Fetch canonical plans
    fetch("/api/plans")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPlans(json.data);
        }
      })
      .catch(() => {});

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const { selectPlan, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<DisplayPlan | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Map active configurations dynamically from single source of truth
  const effectivePlans = plans.length > 0 ? plans : Object.values(PLANS);
  const displayPlans: DisplayPlan[] = effectivePlans.map((p) => ({
    id: p.id,
    name: p.name,
    planName: p.id,
    priceMonthly: p.priceMonthly,
    priceAnnual: p.priceAnnual,
    description: p.description,
    badge: p.badge,
    popular: p.popular,
    isTrialEligible: p.isTrialEligible,
    features: p.featuresDisplay,
  }));

  const handleChoosePlan = async (plan: DisplayPlan) => {
    setSelectedPlan(plan);
    setProcessingPayment(true);

    try {
      const { createStoreSubscriptionAction } = await import("@/lib/actions/payment");
      const res = await createStoreSubscriptionAction(null, plan.planName, billingInterval);

      if (!res.success) {
        toast.error("Checkout Error", res.error || "Failed to initialize subscription checkout.");
        setProcessingPayment(false);
        return;
      }

      const { subscriptionId, keyId, isSimulated } = res.data;

      if (isSimulated) {
        toast.info("Sandbox Mode", "Live Razorpay credentials not configured in this environment.");
        setProcessingPayment(false);
        return;
      }

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "Kraftaura Catalog Platform",
        description: `${plan.name} (${billingInterval === "annual" ? "Annual" : "Monthly"}) Subscription`,
        image: "https://api.dicebear.com/7.x/initials/svg?seed=Kraftaura",
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
            toast.info("Payment Cancelled", "Checkout was cancelled. Your plan has not been changed.");
          },
        },
        handler: async function (response: any) {
          setProcessingPayment(true);
          const { verifySubscriptionPaymentAction } = await import("@/lib/actions/payment");
          const verRes = await verifySubscriptionPaymentAction({
            paymentId: response.razorpay_payment_id,
            subscriptionId: response.razorpay_subscription_id,
            signature: response.razorpay_signature,
            planId: plan.planName,
          });

          if (verRes.success) {
            const activePlan = verRes.data?.verifiedPlan || plan.planName;
            selectPlan(activePlan, "active");
            if (typeof window !== "undefined") {
              localStorage.setItem("symar_selected_plan", activePlan);
              localStorage.setItem("symar_checkout_subscription_id", response.razorpay_subscription_id);
              localStorage.setItem("symar_checkout_payment_id", response.razorpay_payment_id);
              localStorage.setItem("symar_checkout_signature", response.razorpay_signature);
            }

            const nextDateFormatted = verRes.data?.nextBillingDate
              ? new Date(verRes.data.nextBillingDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;

            toast.success(
              "Payment Successful!",
              `Your ${getPlanDisplayName(activePlan)} is now active.${nextDateFormatted ? ` Next billing date: ${nextDateFormatted}` : ""}`
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

      <div className="relative z-10 w-full max-w-6xl space-y-8 my-8 text-center">
        {/* Header Section */}
        <div className="space-y-3">
          <Badge variant="maroon" className="gap-1 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-maroon-300" /> Step 3 of 5 • Subscription &amp; Plan Activation
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight text-white">
            Choose Your Platform Plan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Select the plan tailored for your business volume. Upgrade or modify anytime directly from your merchant dashboard.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="bg-[#111111] p-1 rounded-2xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-heading font-semibold transition-all",
                  billingInterval === "monthly"
                    ? "bg-maroon-800 text-white shadow-glow"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingInterval("annual")}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-heading font-semibold transition-all",
                  billingInterval === "annual"
                    ? "bg-maroon-800 text-white shadow-glow"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Annual Billing
              </button>
            </div>
          </div>
        </div>

        {/* Plans Selection Grid (4 Plans) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left items-stretch">
          {displayPlans.map((plan) => {
            const isPopular = plan.popular;
            const isAnnual = billingInterval === "annual";
            const currentPrice = isAnnual ? `₹${plan.priceAnnual.toLocaleString("en-IN")}` : `₹${plan.priceMonthly.toLocaleString("en-IN")}`;
            const periodLabel = isAnnual ? "year" : "month";

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
                    <h3 className="text-base font-bold font-heading text-white">{plan.name}</h3>
                    <p className="text-[11px] text-zinc-400 font-body mt-1 leading-relaxed">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                        {currentPrice}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">/ {periodLabel}</span>
                    </div>
                    {isAnnual && (
                      <p className="text-[10px] text-emerald-400 font-mono mt-1 font-semibold">
                        (Equivalent to ₹{Math.round(plan.priceAnnual / 12)}/mo)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-white/5 text-[11px] text-zinc-300 font-body">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-[10px] text-zinc-300 font-body text-center bg-white/5 p-2.5 rounded-xl border border-white/10 mt-2 space-y-0.5">
                    <div className="font-semibold text-white">
                      {isAnnual
                        ? `₹${plan.priceAnnual.toLocaleString("en-IN")} today`
                        : `₹${plan.priceMonthly.toLocaleString("en-IN")} today`}
                    </div>
                    <div className="text-zinc-400 text-[9px]">
                      {isAnnual
                        ? `Then ₹${plan.priceAnnual.toLocaleString("en-IN")} every year`
                        : `Then ₹${plan.priceMonthly.toLocaleString("en-IN")} every month`}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleChoosePlan(plan)}
                  variant={isPopular ? "primary" : "outline"}
                  disabled={processingPayment}
                  className={cn(
                    "w-full h-10 text-xs uppercase tracking-wider font-bold shadow-md mt-4",
                    isPopular ? "shadow-glow" : "border-white/10 hover:bg-white/5"
                  )}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
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
