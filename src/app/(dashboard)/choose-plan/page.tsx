"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  X,
  Check,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PLANS, PlanTier } from "@/lib/feature-gating";

interface DisplayPlan {
  id: "starter" | "pro" | "business";
  name: string;
  planName: string;
  price: string;
  amount: number;
  description: string;
  badge?: string;
  popular?: boolean;
  features: string[];
}

const planFeaturesDisplay = {
  starter: [
    "WhatsApp Catalog Order Buttons",
    "Basic Dashboard Overview",
    "Product Management (up to 50 products)",
    "Dedicated Storefront URL Link",
    "Bloom storefront template access",
  ],
  pro: [
    "Everything in Starter Plan",
    "Product Management (up to 500 products)",
    "Store Analytics & Traffic Insights",
    "Curated Collections & Taxonomies",
    "Advanced Customization & Branding",
    "Bloom storefront template personalization",
  ],
  business: [
    "Everything in Pro Plan",
    "Product Management (up to 5000 products)",
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Map PLANS configurations dynamically to match UI items
  const displayPlans: DisplayPlan[] = [
    {
      id: "starter",
      name: PLANS.starter.name,
      planName: "Starter Plan",
      price: `₹${PLANS.starter.priceMonthly}`,
      amount: PLANS.starter.priceMonthly,
      description: PLANS.starter.description,
      features: planFeaturesDisplay.starter,
    },
    {
      id: "pro",
      name: PLANS.pro.name,
      planName: "Pro Plan",
      price: `₹${PLANS.pro.priceMonthly}`,
      amount: PLANS.pro.priceMonthly,
      description: PLANS.pro.description,
      badge: "MOST POPULAR",
      popular: true,
      features: planFeaturesDisplay.pro,
    },
    {
      id: "business",
      name: PLANS.business.name,
      planName: "Business Plan",
      price: `₹${PLANS.business.priceMonthly}`,
      amount: PLANS.business.priceMonthly,
      description: PLANS.business.description,
      badge: "FULL E-COMMERCE",
      features: planFeaturesDisplay.business,
    },
  ];

  const handleChoosePlan = (plan: DisplayPlan) => {
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handleRealRazorpayPayment = async () => {
    if (!selectedPlan) return;
    setProcessingPayment(true);

    try {
      const { createStoreSubscriptionAction } = await import("@/lib/actions/payment");
      const res = await createStoreSubscriptionAction(null, selectedPlan.id);

      if (!res.success) {
        toast.error("Checkout Error", res.error || "Failed to initialize subscription checkout.");
        setProcessingPayment(false);
        return;
      }

      const { subscriptionId, keyId, isSimulated } = res.data;

      if (isSimulated) {
        toast.warning(
          "Test Mode: Simulating Success",
          "Razorpay credentials are placeholders. Transitioning to simulated sandbox checkout."
        );
        handleSimulatePayment(true);
        return;
      }

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "Symar Catalog Platform",
        description: `${selectedPlan.name} Subscription`,
        image: "https://api.dicebear.com/7.x/initials/svg?seed=Symar",
        handler: async function (response: any) {
          setProcessingPayment(true);
          const { verifySubscriptionPaymentAction } = await import("@/lib/actions/payment");
          const verRes = await verifySubscriptionPaymentAction({
            paymentId: response.razorpay_payment_id,
            subscriptionId: response.razorpay_subscription_id,
            signature: response.razorpay_signature,
          });

          if (verRes.success) {
            selectPlan(selectedPlan.planName, "active");
            localStorage.setItem("symar_checkout_subscription_id", response.razorpay_subscription_id);
            localStorage.setItem("symar_checkout_payment_id", response.razorpay_payment_id);
            localStorage.setItem("symar_checkout_signature", response.razorpay_signature);

            toast.success("Payment Successful", "Subscription verified. Opening template selection...");
            router.push("/choose-template");
          } else {
            toast.error("Signature Validation Failed", verRes.error || "Crypto verification mismatch.");
          }
          setProcessingPayment(false);
        },
        prefill: {
          email: user?.email || "",
          name: user?.name || "",
        },
        theme: {
          color: "#800020",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (resp: any) {
        toast.error("Payment Failed", resp.error?.description || "Checkout transaction was not completed.");
        setProcessingPayment(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error("Checkout Launch Error", err.message || "Failed to load checkout.");
      setProcessingPayment(false);
    }
  };

  const handleSimulatePayment = (success: boolean) => {
    if (!selectedPlan) return;

    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentModalOpen(false);

      selectPlan(selectedPlan.planName, success ? "active" : "payment_pending");

      if (success) {
        const mockSubId = `sub_mock_${Date.now()}`;
        const mockPayId = `pay_mock_${Date.now()}`;
        const mockSig = `sig_mock_${Date.now()}`;
        localStorage.setItem("symar_checkout_subscription_id", mockSubId);
        localStorage.setItem("symar_checkout_payment_id", mockPayId);
        localStorage.setItem("symar_checkout_signature", mockSig);

        toast.success(
          `${selectedPlan.name} Activated!`,
          `Payment verified. Continuing to template selection...`
        );
      } else {
        toast.warning(
          `${selectedPlan.name} Selected (Unpaid)`,
          "Subscription created with payment pending status. Active features remain on Free trial."
        );
      }

      router.push("/choose-template");
    }, 1000);
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
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-white/5 text-[11px] text-zinc-300 font-body">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
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

      {/* Simulated Payment Modal */}
      {paymentModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-left relative font-body">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-maroon-400 font-bold">
                Payment Simulator
              </span>
              <h3 className="text-xl font-bold font-heading text-white">
                Activate {selectedPlan.name}
              </h3>
              <p className="text-xs text-zinc-400">
                Simulate instant subscription payment without live credit card charges.
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Selected Plan</span>
                <span className="font-bold text-white">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Billing Period</span>
                <span className="font-mono text-zinc-300">Monthly</span>
              </div>
              <div className="flex justify-between text-sm font-bold font-heading text-white pt-2 border-t border-white/10">
                <span>Total Amount Due</span>
                <span className="font-mono text-amber-400">{selectedPlan.price}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                Select Simulated Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "upi", label: "UPI / GPay" },
                  { id: "card", label: "Debit/Credit" },
                  { id: "netbanking", label: "NetBanking" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={cn(
                      "p-2.5 rounded-xl text-xs font-semibold border text-center transition-all flex flex-col items-center gap-1",
                      paymentMethod === m.id
                        ? "bg-maroon-800/90 border-maroon-500 text-white font-bold"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    )}
                  >
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleRealRazorpayPayment}
                variant="primary"
                isLoading={processingPayment}
                className="w-full h-11 text-xs uppercase tracking-wider font-bold shadow-glow"
                rightIcon={<CreditCard className="w-4 h-4" />}
              >
                Pay via Razorpay ({selectedPlan.price})
              </Button>
              
              <div className="border-t border-white/5 my-1" />
              <p className="text-[9px] text-zinc-500 font-mono text-center">DEVELOPER TESTING CONTROLS:</p>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleSimulatePayment(true)}
                  variant="outline"
                  isLoading={processingPayment}
                  className="text-[10px] h-9 border-white/5 bg-white/5"
                  rightIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Simulate Success
                </Button>
                <Button
                  onClick={() => handleSimulatePayment(false)}
                  variant="outline"
                  isLoading={processingPayment}
                  className="text-[10px] h-9 border-white/5 bg-white/5"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Skip / Pending
                </Button>
              </div>
            </div>

            <p className="text-[9px] text-zinc-500 font-mono text-center leading-relaxed">
              Architecture integrated securely with Razorpay signature verification layers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
