"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Tag,
  Loader2,
  AlertCircle,
  X,
  Package,
  FolderTree,
  Zap,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  PLANS,
  PlanTier,
  BillingInterval,
  PlanConfig,
  normalizePlanTier,
  getPlanDisplayName,
} from "@/lib/feature-gating";
import { validateSaaSPromoCodeAction } from "@/lib/actions/admin";
import {
  createStoreSubscriptionAction,
  verifySubscriptionPaymentAction,
} from "@/lib/actions/payment";

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

interface AppliedCoupon {
  code: string;
  discountType: "percentage" | "flat";
  value: number;
  discountAmount: number;
  finalPrice: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, selectPlan, activeStore, stores } = useAuth();

  // Query parameters
  const rawPlan = searchParams.get("plan") || "growth";
  const rawInterval = searchParams.get("interval") || "monthly";
  const storeIdParam = searchParams.get("storeId");

  const [targetTier, setTargetTier] = useState<PlanTier>(normalizePlanTier(rawPlan));
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    rawInterval === "annual" ? "annual" : "monthly"
  );
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Billing Form State
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingState, setBillingState] = useState("Maharashtra");
  const [isBusinessBilling, setIsBusinessBilling] = useState(false);
  const [gstin, setGstin] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>({});

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Prefill billing information from authenticated user profile and saved drafts
  useEffect(() => {
    if (user) {
      if (!billingName && user.name) setBillingName(user.name);
      if (!billingEmail && user.email) setBillingEmail(user.email);
    }
    if (typeof window !== "undefined") {
      const savedPendingBiz = localStorage.getItem("symar_pending_store_name");
      if (savedPendingBiz && !businessName) {
        setBusinessName(savedPendingBiz);
      }
    }
  }, [user]);

  // Dynamically load Razorpay SDK
  useEffect(() => {
    const scriptId = "razorpay-checkout-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch canonical authoritative plans from API
  useEffect(() => {
    let isMounted = true;
    fetch("/api/plans")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPlans(json.data);
        }
      })
      .catch((err) => {
        console.warn("Using local plans fallback:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPlans(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize target plan with URL parameter changes
  useEffect(() => {
    if (rawPlan) {
      setTargetTier(normalizePlanTier(rawPlan));
    }
  }, [rawPlan]);

  // Synchronize interval with URL parameter changes
  useEffect(() => {
    if (rawInterval === "annual" || rawInterval === "monthly") {
      setBillingInterval(rawInterval);
    }
  }, [rawInterval]);

  // Resolve active plan config
  const currentPlanConfig: PlanConfig =
    plans.find((p) => p.id === targetTier) || PLANS[targetTier] || PLANS.growth;

  const isAnnual = billingInterval === "annual";
  const basePrice = isAnnual ? currentPlanConfig.priceAnnual : currentPlanConfig.priceMonthly;

  // Authoritative revalidation when interval changes
  useEffect(() => {
    if (!appliedCoupon) return;

    let isMounted = true;
    const currentCode = appliedCoupon.code;

    async function revalidate() {
      setIsValidatingCoupon(true);
      try {
        const res = await validateSaaSPromoCodeAction(
          currentCode,
          currentPlanConfig.id,
          billingInterval
        );

        if (!isMounted) return;

        if (res.success) {
          setAppliedCoupon({
            code: res.data.code,
            discountType: res.data.discountType,
            value: res.data.value,
            discountAmount: res.data.discountAmount,
            finalPrice: res.data.finalPrice,
          });
        } else {
          setAppliedCoupon(null);
          setCouponError(res.error || "Coupon not applicable to this billing interval or plan.");
        }
      } catch (err: any) {
        if (isMounted) {
          setAppliedCoupon(null);
          setCouponError("Failed to revalidate coupon.");
        }
      } finally {
        if (isMounted) setIsValidatingCoupon(false);
      }
    }

    revalidate();

    return () => {
      isMounted = false;
    };
  }, [billingInterval, currentPlanConfig.id]);

  // Handle Apply Coupon
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await validateSaaSPromoCodeAction(
        cleanCode,
        currentPlanConfig.id,
        billingInterval
      );

      if (res.success) {
        setAppliedCoupon({
          code: res.data.code,
          discountType: res.data.discountType,
          value: res.data.value,
          discountAmount: res.data.discountAmount,
          finalPrice: res.data.finalPrice,
        });
        setCouponError(null);
        toast.success("Coupon Applied", `Promo code "${cleanCode}" applied successfully.`);
      } else {
        setAppliedCoupon(null);
        setCouponError(res.error || "Invalid coupon code.");
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Failed to validate coupon.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Handle Remove Coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    toast.info("Coupon Removed", "Discount has been removed.");
  };

  // Pricing calculations
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPayable = Math.max(0, basePrice - discountAmount);

  // Return to plan selection
  const effectiveStoreId = storeIdParam || (stores.length > 0 ? stores[0]?.id : null);
  const changePlanHref = effectiveStoreId
    ? `/dashboard/billing`
    : `/choose-plan`;

  // Proceed to Payment CTA handler -> Validate form, then LAUNCH RAZORPAY
  const handleProceedToPayment = async () => {
    if (isProcessingPayment) return;

    // Validate billing details
    const errors: Record<string, string> = {};
    if (!billingName.trim()) {
      errors.name = "Full name is required";
    }
    if (!billingEmail.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail.trim())) {
      errors.email = "Please enter a valid email address";
    }
    const cleanPhone = billingPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      errors.phone = "Phone number is required";
    } else if (cleanPhone.length < 10) {
      errors.phone = "Please enter a valid 10-digit mobile number";
    }
    if (!billingState.trim()) {
      errors.state = "Please select your state";
    }
    if (isBusinessBilling) {
      if (!gstin.trim()) {
        errors.gstin = "GSTIN is required for business billing";
      } else if (gstin.trim().length !== 15) {
        errors.gstin = "GSTIN must be exactly 15 characters";
      }
      if (!businessName.trim()) {
        errors.businessName = "Business name is required";
      }
    }

    if (Object.keys(errors).length > 0) {
      setBillingErrors(errors);
      toast.error("Billing Information Required", "Please fill in all required billing details before payment.");
      return;
    }
    setBillingErrors({});
    setIsProcessingPayment(true);

    try {
      // 1. Authoritative subscription creation on server
      const res = await createStoreSubscriptionAction(
        effectiveStoreId,
        currentPlanConfig.id,
        billingInterval,
        appliedCoupon?.code || null,
        {
          name: billingName.trim(),
          email: billingEmail.trim(),
          phone: cleanPhone,
          state: billingState.trim(),
          isBusinessBilling,
          gstin: isBusinessBilling ? gstin.trim().toUpperCase() : undefined,
          businessName: isBusinessBilling ? businessName.trim() : undefined,
        }
      );

      if (!res.success) {
        toast.error("Checkout Error", res.error || "Failed to initialize payment.");
        setIsProcessingPayment(false);
        return;
      }

      const { subscriptionId, keyId, isSimulated } = res.data;

      // Handle sandbox / simulation environment
      if (isSimulated) {
        toast.info("Sandbox Mode", "Payment simulated. Activating trial / sandbox subscription.");
        const verRes = await verifySubscriptionPaymentAction({
          storeId: effectiveStoreId,
          paymentId: `pay_mock_${Date.now()}`,
          subscriptionId: subscriptionId,
          signature: "sig_mock",
          planId: currentPlanConfig.id,
        });

        if (verRes.success) {
          selectPlan(currentPlanConfig.id, "active");
          toast.success("Subscription Active", `Your ${currentPlanConfig.name} is now active.`);
          router.push(effectiveStoreId ? "/dashboard/billing" : "/choose-template");
        } else {
          toast.error("Activation Failed", verRes.error || "Failed to activate subscription.");
        }
        setIsProcessingPayment(false);
        return;
      }

      // Check window.Razorpay SDK
      if (typeof window === "undefined" || !(window as any).Razorpay) {
        toast.error("Payment Gateway Error", "Razorpay script could not be loaded. Please refresh.");
        setIsProcessingPayment(false);
        return;
      }

      // 2. Configure and open live Razorpay modal
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "Kraftaura Catalog Platform",
        description: `${currentPlanConfig.name} (${isAnnual ? "Annual" : "Monthly"}) Subscription`,
        image: "https://api.dicebear.com/7.x/initials/svg?seed=Kraftaura",
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            toast.info("Payment Cancelled", "Checkout was cancelled. Your current plan remains unchanged.");
          },
        },
        handler: async function (response: any) {
          setIsProcessingPayment(true);
          try {
            const verRes = await verifySubscriptionPaymentAction({
              storeId: effectiveStoreId,
              paymentId: response.razorpay_payment_id,
              subscriptionId: response.razorpay_subscription_id,
              signature: response.razorpay_signature,
              planId: currentPlanConfig.id,
            });

            if (verRes.success) {
              const activePlan = verRes.data?.verifiedPlan || currentPlanConfig.id;
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
                `Your ${getPlanDisplayName(activePlan)} is now active.${
                  nextDateFormatted ? ` Next renewal: ${nextDateFormatted}` : ""
                }`
              );

              // Route directly to Store Setup for new merchants, or billing for existing merchants
              router.push(effectiveStoreId ? "/dashboard/billing" : "/choose-template");
            } else {
              toast.error("Signature Verification Failed", verRes.error || "Cryptographic verification mismatch.");
              setIsProcessingPayment(false);
            }
          } catch (err: any) {
            toast.error("Verification Error", err.message || "Failed to confirm payment.");
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          email: billingEmail.trim(),
          name: billingName.trim(),
          contact: cleanPhone,
        },
        theme: {
          color: "#800020",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (resp: any) {
        toast.error("Payment Failed", resp.error?.description || "Payment cancelled or rejected. Plan remains unchanged.");
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error("Checkout Launch Error", err.message || "Failed to initialize payment gateway.");
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-maroon-800 selection:text-white font-body py-8 sm:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-between">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-maroon-900/15 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-maroon-950/20 blur-[180px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto w-full relative z-10 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="maroon" className="gap-1.5 py-0.5 px-2.5 text-[10px] uppercase font-mono tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Secure Checkout
              </Badge>
              <span className="text-xs text-zinc-500 font-mono">• 256-Bit SSL Encrypted</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Complete Your Purchase
            </h1>
            <p className="text-xs text-zinc-400 font-body">
              Review your plan, verify billing details, apply coupons, and activate your store catalog.
            </p>
          </div>

          <Link href={changePlanHref}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-white/10 hover:bg-white/5 text-zinc-300 gap-1.5 h-9"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Change Plan
            </Button>
          </Link>
        </div>

        {/* 2-Column Responsive Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: YOUR PLAN & INCLUDED BENEFITS (7 cols)           */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-[#111111]/90 border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-6">
              {/* Plan Title & Price header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                      {currentPlanConfig.name}
                    </h2>
                    {currentPlanConfig.badge && (
                      <Badge variant="maroon" className="text-[10px] uppercase tracking-wider font-mono">
                        {currentPlanConfig.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-body leading-relaxed max-w-md">
                    {currentPlanConfig.description}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="flex items-baseline gap-1 sm:justify-end">
                    <span className="text-3xl font-extrabold font-heading text-white">
                      ₹{basePrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      /{isAnnual ? "year" : "month"}
                    </span>
                  </div>
                  {isAnnual && (
                    <p className="text-[11px] text-emerald-400 font-mono font-semibold mt-0.5">
                      (Equivalent to ₹{Math.round(basePrice / 12)}/month)
                    </p>
                  )}
                </div>
              </div>

              {/* Resource Capacity Highlight Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#161616] p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-maroon-900/40 border border-maroon-700/40 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-maroon-300" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider font-semibold">
                      Product Limit
                    </div>
                    <div className="text-xs font-bold text-white font-heading">
                      {currentPlanConfig.productLimit === -1 || currentPlanConfig.productLimit >= 99999
                        ? "Unlimited Products"
                        : `Up to ${currentPlanConfig.productLimit} Products`}
                    </div>
                  </div>
                </div>

                <div className="bg-[#161616] p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950/40 border border-emerald-700/40 flex items-center justify-center shrink-0">
                    <FolderTree className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider font-semibold">
                      Category Limit
                    </div>
                    <div className="text-xs font-bold text-white font-heading">
                      {currentPlanConfig.categoryLimit >= 999999
                        ? "Unlimited Categories"
                        : `Up to ${currentPlanConfig.categoryLimit} Categories`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete List of Included Benefits */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Included In This Plan:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentPlanConfig.featuresDisplay.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-zinc-300 font-body bg-white/[0.02] p-2.5 rounded-xl border border-white/5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick-Action: Change Plan link */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Want a different catalog tier or feature set?</span>
                <Link
                  href={changePlanHref}
                  className="text-maroon-400 hover:text-maroon-300 font-semibold font-heading hover:underline flex items-center gap-1"
                >
                  Change Plan <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>

            {/* Platform Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-zinc-400 text-xs font-body">
              <div className="bg-[#111111]/60 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Instant activation after payment</span>
              </div>
              <div className="bg-[#111111]/60 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                <Zap className="w-5 h-5 text-maroon-400 shrink-0" />
                <span>Switch or cancel anytime</span>
              </div>
              <div className="bg-[#111111]/60 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                <Lock className="w-5 h-5 text-zinc-400 shrink-0" />
                <span>Zero card info stored on servers</span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: BILLING INFO + PAYMENT BREAKDOWN (5 cols)      */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. BILLING INFORMATION CARD */}
            <Card className="bg-[#151515] border-white/10 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-maroon-400" />
                  <h3 className="text-base font-bold font-heading text-white uppercase tracking-wider">
                    Billing Details
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Step 1 of 2</span>
              </div>

              <div className="space-y-4 text-xs font-body">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    Full Name <span className="text-maroon-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={billingName}
                    onChange={(e) => {
                      setBillingName(e.target.value);
                      if (billingErrors.name) {
                        setBillingErrors((prev) => ({ ...prev, name: "" }));
                      }
                    }}
                    placeholder="Enter your full name"
                    className={cn(
                      "w-full bg-[#0c0c0c] border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all",
                      billingErrors.name
                        ? "border-red-500/70 focus:border-red-500 focus:ring-red-500"
                        : "border-white/10 focus:border-maroon-500 focus:ring-maroon-500"
                    )}
                    disabled={isProcessingPayment}
                  />
                  {billingErrors.name && (
                    <p className="text-[11px] text-red-400 font-mono">{billingErrors.name}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    Email Address <span className="text-maroon-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => {
                      setBillingEmail(e.target.value);
                      if (billingErrors.email) {
                        setBillingErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="merchant@example.com"
                    className={cn(
                      "w-full bg-[#0c0c0c] border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all",
                      billingErrors.email
                        ? "border-red-500/70 focus:border-red-500 focus:ring-red-500"
                        : "border-white/10 focus:border-maroon-500 focus:ring-maroon-500"
                    )}
                    disabled={isProcessingPayment}
                  />
                  {billingErrors.email && (
                    <p className="text-[11px] text-red-400 font-mono">{billingErrors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    Phone Number <span className="text-maroon-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-400 font-mono font-semibold shrink-0 flex items-center">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={billingPhone}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setBillingPhone(val);
                        if (billingErrors.phone) {
                          setBillingErrors((prev) => ({ ...prev, phone: "" }));
                        }
                      }}
                      placeholder="9876543210"
                      className={cn(
                        "w-full bg-[#0c0c0c] border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all",
                        billingErrors.phone
                          ? "border-red-500/70 focus:border-red-500 focus:ring-red-500"
                          : "border-white/10 focus:border-maroon-500 focus:ring-maroon-500"
                      )}
                      disabled={isProcessingPayment}
                    />
                  </div>
                  {billingErrors.phone && (
                    <p className="text-[11px] text-red-400 font-mono">{billingErrors.phone}</p>
                  )}
                </div>

                {/* State Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    State / UT <span className="text-maroon-400">*</span>
                  </label>
                  <select
                    value={billingState}
                    onChange={(e) => {
                      setBillingState(e.target.value);
                      if (billingErrors.state) {
                        setBillingErrors((prev) => ({ ...prev, state: "" }));
                      }
                    }}
                    className={cn(
                      "w-full bg-[#0c0c0c] border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 transition-all",
                      billingErrors.state
                        ? "border-red-500/70 focus:border-red-500 focus:ring-red-500"
                        : "border-white/10 focus:border-maroon-500 focus:ring-maroon-500"
                    )}
                    disabled={isProcessingPayment}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st} className="bg-[#111111] text-white">
                        {st}
                      </option>
                    ))}
                  </select>
                  {billingErrors.state && (
                    <p className="text-[11px] text-red-400 font-mono">{billingErrors.state}</p>
                  )}
                </div>

                {/* Business Billing / GST Toggle */}
                <div className="pt-2 border-t border-white/5 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isBusinessBilling}
                      onChange={(e) => setIsBusinessBilling(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-[#0c0c0c] text-maroon-600 focus:ring-maroon-500 focus:ring-offset-0 focus:ring-1"
                      disabled={isProcessingPayment}
                    />
                    <span className="text-xs font-medium text-zinc-300">
                      I have a GST number (Business Billing)
                    </span>
                  </label>

                  {isBusinessBilling && (
                    <div className="p-3.5 bg-[#0c0c0c] rounded-2xl border border-white/10 space-y-3 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-semibold uppercase text-zinc-400 flex items-center gap-1">
                          <Receipt className="w-3 h-3 text-zinc-500" />
                          GSTIN (15 Digits) *
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          value={gstin}
                          onChange={(e) => {
                            setGstin(e.target.value.toUpperCase());
                            if (billingErrors.gstin) {
                              setBillingErrors((prev) => ({ ...prev, gstin: "" }));
                            }
                          }}
                          placeholder="e.g. 27AAAAA0000A1Z5"
                          className={cn(
                            "w-full bg-[#161616] border rounded-xl px-3 py-2 text-xs text-white uppercase font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1",
                            billingErrors.gstin
                              ? "border-red-500/70 focus:border-red-500"
                              : "border-white/10 focus:border-maroon-500"
                          )}
                          disabled={isProcessingPayment}
                        />
                        {billingErrors.gstin && (
                          <p className="text-[10px] text-red-400 font-mono">{billingErrors.gstin}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-semibold uppercase text-zinc-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-zinc-500" />
                          Registered Business Name *
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => {
                            setBusinessName(e.target.value);
                            if (billingErrors.businessName) {
                              setBillingErrors((prev) => ({ ...prev, businessName: "" }));
                            }
                          }}
                          placeholder="e.g. Acme Retail Pvt Ltd"
                          className={cn(
                            "w-full bg-[#161616] border rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1",
                            billingErrors.businessName
                              ? "border-red-500/70 focus:border-red-500"
                              : "border-white/10 focus:border-maroon-500"
                          )}
                          disabled={isProcessingPayment}
                        />
                        {billingErrors.businessName && (
                          <p className="text-[10px] text-red-400 font-mono">{billingErrors.businessName}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* 2. ORDER SUMMARY & COUPON CARD */}
            <Card className="bg-[#151515] border-white/10 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-6 relative">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-base font-bold font-heading text-white uppercase tracking-wider">
                  Order Summary
                </h3>
                <Badge variant="maroon" className="text-[10px] font-mono uppercase">
                  Razorpay Verified
                </Badge>
              </div>

              {/* Billing Cycle Switcher */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Billing Period
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setBillingInterval("monthly")}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-heading font-semibold transition-all text-center",
                      !isAnnual
                        ? "bg-maroon-800 text-white shadow-glow"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval("annual")}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-heading font-semibold transition-all text-center relative",
                      isAnnual
                        ? "bg-maroon-800 text-white shadow-glow"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    Annual
                    <span className="ml-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono uppercase">
                      Save ~17%
                    </span>
                  </button>
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="space-y-2.5 pt-2">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-maroon-400" />
                    Coupon / Promo Code
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                      Applied
                    </span>
                  )}
                </label>

                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        placeholder="Enter coupon code"
                        className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder:text-zinc-600 focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500"
                        disabled={isValidatingCoupon || isProcessingPayment}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!couponInput.trim() || isValidatingCoupon || isProcessingPayment}
                      className="px-4 text-xs font-bold uppercase tracking-wider h-10 shrink-0"
                    >
                      {isValidatingCoupon ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="bg-emerald-950/30 border border-emerald-600/40 p-3 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-mono font-bold text-white tracking-wide">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-emerald-400 ml-2 text-[11px]">
                          {appliedCoupon.discountType === "percentage"
                            ? `(${appliedCoupon.value}% OFF)`
                            : `(-₹${appliedCoupon.discountAmount})`}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                      title="Remove Coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {couponError && (
                  <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown Line Items */}
              <div className="space-y-3 pt-4 border-t border-white/10 text-xs font-body">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Plan</span>
                  <span className="font-semibold text-white font-heading">
                    {currentPlanConfig.name}
                  </span>
                </div>

                <div className="flex justify-between items-center text-zinc-400">
                  <span>Billing Period</span>
                  <span className="font-semibold text-white capitalize">
                    {isAnnual ? "Annual (Yearly)" : "Monthly"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-zinc-400">
                  <span>Plan Price</span>
                  <span className="font-mono font-medium text-white">
                    ₹{basePrice.toLocaleString("en-IN")}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Discount ({appliedCoupon.code})
                    </span>
                    <span className="font-mono">
                      -₹{discountAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-zinc-400 pt-1">
                  <span>Subtotal</span>
                  <span className="font-mono text-zinc-300">
                    ₹{(basePrice - discountAmount).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Final Total */}
                <div className="border-t border-white/10 pt-4 flex justify-between items-baseline">
                  <div>
                    <div className="text-sm font-bold font-heading uppercase text-white tracking-wide">
                      Total Payable
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      (Inclusive of all applicable taxes)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                      ₹{finalPayable.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Billed {isAnnual ? "annually" : "monthly"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary CTA: Proceed to Payment */}
              <div className="pt-2">
                <Button
                  onClick={handleProceedToPayment}
                  variant="primary"
                  disabled={isProcessingPayment || isValidatingCoupon}
                  className="w-full h-12 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-glow-lg rounded-2xl flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Securing Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Proceed to Payment • ₹{finalPayable.toLocaleString("en-IN")}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Payment Methods Supported */}
              <div className="text-[11px] text-zinc-500 text-center space-y-1 pt-2 font-mono">
                <div>Supports UPI, Cards (Visa/Mastercard/RuPay), NetBanking &amp; Wallets</div>
                <div className="text-zinc-600 text-[10px]">
                  Recurring subscription managed securely via Razorpay
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">
          <Loader2 className="w-6 h-6 animate-spin text-maroon-500" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
