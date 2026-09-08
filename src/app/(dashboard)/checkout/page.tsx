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
  CreditCard,
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
  const { user, selectPlan, stores } = useAuth();

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
          router.push(effectiveStoreId ? "/dashboard/billing" : "/create-store");
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
              router.push(effectiveStoreId ? "/dashboard/billing" : "/create-store");
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
    <div className="min-h-screen bg-[#080808] text-white selection:bg-maroon-800 selection:text-white font-body pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-maroon-900/15 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-maroon-950/20 blur-[180px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto w-full relative z-10 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="maroon" className="gap-1.5 py-0.5 px-2.5 text-[10px] uppercase font-mono tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Secure Checkout
              </Badge>
              <span className="text-[11px] text-zinc-500 font-mono">• 256-Bit SSL Encrypted</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-heading text-white tracking-tight">
              Complete Your Purchase
            </h1>
            <p className="text-xs text-zinc-400 font-body">
              Review your plan, verify billing details, apply coupons, and activate your store catalog.
            </p>
          </div>

          <Link href={changePlanHref} className="self-start sm:self-auto shrink-0">
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

        {/* 2-Column Responsive Checkout Grid (50 / 50 on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: SELECTED PLAN & BENEFITS (6 cols)              */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 space-y-5">
            <Card className="bg-[#111111]/90 border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-5">
              {/* Plan Title & Price Header */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                      {currentPlanConfig.name}
                    </h2>
                    {currentPlanConfig.badge && (
                      <Badge variant="maroon" className="text-[10px] uppercase tracking-wider font-mono">
                        {currentPlanConfig.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-body leading-relaxed max-w-sm">
                    {currentPlanConfig.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                      ₹{basePrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      /{isAnnual ? "year" : "month"}
                    </span>
                  </div>
                  {isAnnual && (
                    <p className="text-[11px] text-emerald-400 font-mono font-semibold mt-0.5">
                      (₹{Math.round(basePrice / 12)}/mo)
                    </p>
                  )}
                </div>
              </div>

              {/* Resource Capacity Highlight Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#161616] p-3 rounded-2xl border border-white/5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-maroon-900/40 border border-maroon-700/40 flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5 text-maroon-300" />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-mono text-zinc-500 tracking-wider font-semibold">
                      Product Limit
                    </div>
                    <div className="text-xs font-bold text-white font-heading truncate">
                      {currentPlanConfig.productLimit === -1 || currentPlanConfig.productLimit >= 99999
                        ? "Unlimited"
                        : `Up to ${currentPlanConfig.productLimit}`}
                    </div>
                  </div>
                </div>

                <div className="bg-[#161616] p-3 rounded-2xl border border-white/5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/40 border border-emerald-700/40 flex items-center justify-center shrink-0">
                    <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-mono text-zinc-500 tracking-wider font-semibold">
                      Category Limit
                    </div>
                    <div className="text-xs font-bold text-white font-heading truncate">
                      {currentPlanConfig.categoryLimit >= 999999
                        ? "Unlimited"
                        : `Up to ${currentPlanConfig.categoryLimit}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete List of Included Benefits */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Included In This Plan:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPlanConfig.featuresDisplay.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-zinc-300 font-body bg-white/[0.02] p-2.5 rounded-xl border border-white/5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Change Plan link */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Want a different tier?</span>
                <Link
                  href={changePlanHref}
                  className="text-maroon-400 hover:text-maroon-300 font-semibold font-heading hover:underline flex items-center gap-1"
                >
                  Change Plan <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>

            {/* Platform Guarantees Banner */}
            <div className="grid grid-cols-3 gap-3 text-zinc-400 text-[11px] font-body">
              <div className="bg-[#111111]/70 p-3 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Instant activation</span>
              </div>
              <div className="bg-[#111111]/70 p-3 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2">
                <Zap className="w-4 h-4 text-maroon-400 shrink-0 mt-0.5" />
                <span>Cancel anytime</span>
              </div>
              <div className="bg-[#111111]/70 p-3 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2">
                <Lock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>Zero card data saved</span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: UNIFIED BILLING & ORDER SUMMARY (6 cols)       */}
          {/* ============================================================ */}
          <div className="lg:col-span-6">
            <Card className="bg-[#151515] border-white/10 p-5 sm:p-7 rounded-3xl shadow-2xl space-y-6">
              {/* 1. BILLING INFORMATION SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-maroon-400" />
                    <h3 className="text-sm sm:text-base font-bold font-heading text-white uppercase tracking-wider">
                      Billing Information
                    </h3>
                  </div>
                  <Badge variant="maroon" className="text-[10px] font-mono uppercase">
                    Razorpay Verified
                  </Badge>
                </div>

                {/* 2-Column Responsive Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-body">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
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
                      placeholder="Your Full Name"
                      className={cn(
                        "w-full bg-[#0c0c0c] border rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all",
                        billingErrors.name
                          ? "border-red-500/70 focus:border-red-500 focus:ring-red-500"
                          : "border-white/10 focus:border-maroon-500 focus:ring-maroon-500"
                      )}
                      disabled={isProcessingPayment}
                    />
                    {billingErrors.name && (
                      <p className="text-[10px] text-red-400 font-mono">{billingErrors.name}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
                      Phone Number <span className="text-maroon-400">*</span>
                    </label>
                    <div className="flex gap-1.5">
                      <div className="bg-[#0c0c0c] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-zinc-400 font-mono font-semibold shrink-0 flex items-center">
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
                          "w-full bg-[#0c0c0c] border rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all",
                          billingErrors.phone
                            ? "border-red-500/70 focus:border-red-500 focus:ring-red-500"
                            : "border-white/10 focus:border-maroon-500 focus:ring-maroon-500"
                        )}
                        disabled={isProcessingPayment}
                      />
                    </div>
                    {billingErrors.phone && (
                      <p className="text-[10px] text-red-400 font-mono">{billingErrors.phone}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
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
                        "w-full bg-[#0c0c0c] border rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all",
                        billingErrors.email
                          ? "border-red-500/70 focus:border-red-500 focus:ring-red-500"
                          : "border-white/10 focus:border-maroon-500 focus:ring-maroon-500"
                      )}
                      disabled={isProcessingPayment}
                    />
                    {billingErrors.email && (
                      <p className="text-[10px] text-red-400 font-mono">{billingErrors.email}</p>
                    )}
                  </div>

                  {/* State / UT */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
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
                        "w-full bg-[#0c0c0c] border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 transition-all",
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
                      <p className="text-[10px] text-red-400 font-mono">{billingErrors.state}</p>
                    )}
                  </div>
                </div>

                {/* Business Billing / GST Toggle */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isBusinessBilling}
                      onChange={(e) => setIsBusinessBilling(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-[#0c0c0c] text-maroon-600 focus:ring-maroon-500 focus:ring-offset-0 focus:ring-1"
                      disabled={isProcessingPayment}
                    />
                    <span className="text-[11px] font-medium text-zinc-400">
                      I have a GST number (Business Billing)
                    </span>
                  </label>

                  {isBusinessBilling && (
                    <div className="mt-2.5 p-3 bg-[#0c0c0c] rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
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
                          placeholder="27AAAAA0000A1Z5"
                          className={cn(
                            "w-full bg-[#161616] border rounded-xl px-2.5 py-1.5 text-xs text-white uppercase font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1",
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
                        <label className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-zinc-500" />
                          Business Name *
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
                          placeholder="Company Name Pvt Ltd"
                          className={cn(
                            "w-full bg-[#161616] border rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1",
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

              {/* 2. ORDER SUMMARY & PAYMENT BREAKDOWN SECTION */}
              <div className="space-y-4 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold font-heading text-white uppercase tracking-wider">
                    Order Summary
                  </h4>
                  {/* Compact Billing Period Toggle */}
                  <div className="flex items-center bg-[#0c0c0c] p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setBillingInterval("monthly")}
                      className={cn(
                        "py-1 px-2.5 rounded-lg text-xs font-heading font-semibold transition-all",
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
                        "py-1 px-2.5 rounded-lg text-xs font-heading font-semibold transition-all flex items-center gap-1",
                        isAnnual
                          ? "bg-maroon-800 text-white shadow-glow"
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      <span>Annual</span>
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-mono uppercase">
                        -17%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div>
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 bg-[#0c0c0c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono placeholder:text-zinc-600 focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500"
                        disabled={isValidatingCoupon || isProcessingPayment}
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={!couponInput.trim() || isValidatingCoupon || isProcessingPayment}
                        className="px-3.5 text-xs font-bold uppercase tracking-wider h-9 shrink-0"
                      >
                        {isValidatingCoupon ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="bg-emerald-950/30 border border-emerald-600/40 px-3 py-2 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono font-bold text-white tracking-wide">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-emerald-400 text-[11px]">
                          {appliedCoupon.discountType === "percentage"
                            ? `(${appliedCoupon.value}% OFF)`
                            : `(-₹${appliedCoupon.discountAmount})`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                        title="Remove Coupon"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <div className="mt-1.5 p-2 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{couponError}</span>
                    </div>
                  )}
                </div>

                {/* Pricing Line Items */}
                <div className="space-y-2 pt-2 border-t border-white/5 text-xs font-body">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Plan</span>
                    <span className="font-semibold text-white font-heading">
                      {currentPlanConfig.name} ({isAnnual ? "Annual" : "Monthly"})
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Plan Price</span>
                    <span className="font-mono text-white">
                      ₹{basePrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Coupon Discount
                      </span>
                      <span className="font-mono">
                        -₹{discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-zinc-300">
                      ₹{(basePrice - discountAmount).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Final Total Line */}
                  <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                    <div>
                      <div className="text-xs sm:text-sm font-bold font-heading uppercase text-white tracking-wide">
                        Total Payable
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        Inclusive of all applicable taxes
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
                <div className="pt-1">
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

                {/* Supported Gateways Info */}
                <div className="text-[10px] text-zinc-500 text-center space-y-0.5 font-mono pt-1">
                  <div>Supports UPI, Cards (Visa/Mastercard/RuPay), NetBanking &amp; Wallets</div>
                  <div className="text-zinc-600">
                    Recurring subscription managed securely via Razorpay
                  </div>
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
