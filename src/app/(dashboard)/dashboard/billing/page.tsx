"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CreditCard, CheckCircle2, AlertCircle, Loader2, Calendar, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getStoreSubscriptionAction, updateStoreSubscriptionAction, StoreSubscription } from "@/lib/actions/subscription";
import { isAdminUser } from "@/lib/services/admin-roles";
import { createClient } from "@/lib/supabase/client";
import { PLANS, PlanTier, PlanConfig, getPlanDisplayName, getPlanHierarchyWeight } from "@/lib/feature-gating";

export default function MerchantBillingPage() {
  const { activeStore, user, refreshSession } = useAuth();
  const [subscription, setSubscription] = useState<StoreSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPlan, setAdminPlan] = useState<PlanTier>("startup");
  const [adminExpiryDays, setAdminExpiryDays] = useState(30);
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [processingUpgrade, setProcessingUpgrade] = useState<string | null>(null);

  const effectivePlans = plans.length > 0 ? plans : Object.values(PLANS);
  const PLANS_CATALOG = effectivePlans.map((p) => ({
    id: p.id,
    name: p.name,
    price: `₹${p.priceMonthly.toLocaleString("en-IN")}/mo`,
    desc: p.description + ` Up to ${p.productLimit} products.`,
    limit: p.productLimit,
    hierarchyWeight: p.hierarchyWeight,
  }));

  // Load Razorpay SDK checkout overlay script on billing mount
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

  const fetchSubscription = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const response = await getStoreSubscriptionAction(activeStore.id);
      if (response.success && response.subscription) {
        setSubscription(response.subscription);
      } else {
        toast.error("Error", response.error || "Failed to load subscription details.");
      }
    } catch (e) {
      toast.error("Error", "Could not query subscription status.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!activeStore?.id) return;

    try {
      const supabase = createClient();
      const { data, error } = await (supabase.from("payments") as any)
        .select("*")
        .eq("store_id", activeStore.id)
        .order("created_at", { ascending: false });

      if (data && !error) {
        setPayments(data);
      }
    } catch (e) {
      console.error("Failed to load payment history:", e);
    }
  };

  useEffect(() => {
    fetchSubscription();
    fetchPayments();

    fetch("/api/plans")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPlans(json.data);
        }
      })
      .catch(() => {});

    const handlePlansUpdated = () => {
      fetch("/api/plans")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setPlans(json.data);
          }
        })
        .catch(() => {});
    };

    window.addEventListener("symar:plans-updated", handlePlansUpdated);

    // Check if user is admin
    if (user?.email) {
      setIsAdmin(isAdminUser(user.email));
    }

    return () => window.removeEventListener("symar:plans-updated", handlePlansUpdated);
  }, [activeStore, user]);

  const notifyStateChange = async () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("symar:subscription-updated"));
    }
    if (refreshSession) {
      await refreshSession();
    }
  };

  const handleRequestUpgrade = async (planId: PlanTier) => {
    if (!activeStore?.id) return;
    setProcessingUpgrade(planId);

    try {
      const { createStoreSubscriptionAction } = await import("@/lib/actions/payment");
      const res = await createStoreSubscriptionAction(activeStore.id, planId, billingInterval);

      if (!res.success) {
        toast.error("Upgrade Error", res.error || "Failed to create subscription order.");
        setProcessingUpgrade(null);
        return;
      }

      const { subscriptionId, keyId, isSimulated } = res.data;

      if (isSimulated) {
        toast.info("Sandbox Mode", "Live Razorpay credentials not configured in this environment.");
        setProcessingUpgrade(null);
        return;
      }

      const targetPlanConfig = PLANS_CATALOG.find((p) => p.id === planId) || PLANS_CATALOG[0];

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "Kraftaura Platform Upgrade",
        description: `Upgrade to ${targetPlanConfig.name} (${billingInterval === "annual" ? "Annual" : "Monthly"})`,
        image: "https://api.dicebear.com/7.x/initials/svg?seed=Kraftaura",
        modal: {
          ondismiss: function () {
            setProcessingUpgrade(null);
            toast.info("Payment Cancelled", "Payment was cancelled. Your current plan remains unchanged.");
          },
        },
        handler: async function (response: any) {
          setProcessingUpgrade(planId);
          const { verifySubscriptionPaymentAction } = await import("@/lib/actions/payment");
          const verRes = await verifySubscriptionPaymentAction({
            storeId: activeStore.id,
            paymentId: response.razorpay_payment_id,
            subscriptionId: response.razorpay_subscription_id,
            signature: response.razorpay_signature,
            planId: planId,
          });

          if (verRes.success) {
            const nextDateFormatted = verRes.data?.nextBillingDate
              ? new Date(verRes.data.nextBillingDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;

            toast.success(
              "Payment Successful!",
              `Payment verified. Store upgraded to ${targetPlanConfig.name}!${nextDateFormatted ? ` Next renewal: ${nextDateFormatted}` : ""}`
            );
            await fetchSubscription();
            await fetchPayments();
            await notifyStateChange();
          } else {
            toast.error("Verification Failed", "Payment verification failed. Your current plan remains unchanged.");
          }
          setProcessingUpgrade(null);
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
        toast.error("Payment Failed", "Payment was unsuccessful. Your current plan remains unchanged.");
        setProcessingUpgrade(null);
      });
      rzp.open();
    } catch (err: any) {
      toast.error("Checkout Launch Error", err.message || "Failed to load checkout. Your current plan remains unchanged.");
      setProcessingUpgrade(null);
    }
  };

  const handleAdminOverride = async () => {
    if (!activeStore?.id) return;
    setIsUpdatingAdmin(true);
    try {
      const response = await updateStoreSubscriptionAction(
        activeStore.id,
        adminPlan,
        "active",
        adminExpiryDays
      );
      if (response.success) {
        toast.success("Success", `Override applied: store is now on ${getPlanDisplayName(adminPlan)}.`);
        await fetchSubscription();
        await notifyStateChange();
      } else {
        toast.error("Access Denied", response.error || "Super Admin override failed.");
      }
    } catch (e) {
      toast.error("Error", "Failed to apply admin overrides.");
    } finally {
      setIsUpdatingAdmin(false);
    }
  };

  if (!activeStore) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Billing & Plans" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-maroon-500" />
        </div>
      </DashboardLayout>
    );
  }

  const currentActivePlan = subscription?.plan || "startup";
  const displayPlanName = getPlanDisplayName(currentActivePlan);
  const currentPlanWeight = subscription?.status === "active" ? getPlanHierarchyWeight(currentActivePlan) : 0;

  return (
    <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Billing & Plans" }]}>
      <div className="space-y-6 text-left">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">Billing & Subscriptions</h1>
          <p className="text-xs text-zinc-400 font-body">Manage merchant subscriptions, invoices, and growth plan quotas.</p>
        </div>

        {/* Current Active Plan Card */}
        {isLoading ? (
          <Card className="bg-[#111111] border-white/10 p-5 flex items-center justify-center min-h-[100px]">
            <Loader2 className="w-6 h-6 animate-spin text-maroon-500" />
          </Card>
        ) : subscription ? (
          <Card className="bg-[#111111] border-white/10 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block font-heading">
                Current Active Subscription
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-heading uppercase">
                  {displayPlanName}
                </h3>
                <Badge
                  className={cn(
                    "text-[10px] py-0.5 uppercase tracking-wider font-mono",
                    subscription.status === "active" && "bg-emerald-950/80 border border-emerald-700/50 text-emerald-400",
                    subscription.status === "trialing" && "bg-blue-950/80 border border-blue-700/50 text-blue-400",
                    subscription.status === "expired" && "bg-rose-950/80 border border-rose-700/50 text-rose-400",
                    subscription.status === "halted" && "bg-rose-950/80 border border-rose-700/50 text-rose-400",
                    subscription.status === "cancelled" && "bg-zinc-800/80 border border-zinc-700 text-zinc-400",
                    (subscription.status === "pending" || subscription.status === "payment_pending") && "bg-amber-950/80 border border-amber-700/50 text-amber-400"
                  )}
                >
                  {subscription.status === "payment_pending" ? "payment pending" : subscription.status}
                </Badge>
              </div>
              
              <div className="space-y-1 pt-1.5 font-body text-xs text-zinc-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>
                    {(subscription.nextBillingDate || subscription.expiresAt) ? (
                      <>
                        Next Renewal / Billing Date:{" "}
                        <span className="font-mono text-white font-semibold">
                          {new Date(subscription.nextBillingDate || subscription.expiresAt!).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {subscription.amount ? (
                          <span className="font-mono text-emerald-400 font-semibold ml-1.5">
                            (₹{subscription.amount})
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "No billing period defined"
                    )}
                  </span>
                </div>
                
                {subscription.expiresAt && subscription.daysRemaining !== null && (
                  <p className="text-maroon-400 font-semibold">
                    {subscription.daysRemaining > 0 
                      ? `${subscription.daysRemaining} days remaining in billing cycle.`
                      : "Expired: entitlement features downgraded to Free tier."
                    }
                  </p>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        {/* Super Admin Control Override Panel */}
        {isAdmin && (
          <Card className="bg-maroon-950/20 border border-maroon-700/40 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-maroon-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold font-heading uppercase tracking-wide">
                Super Admin Override Controls
              </h3>
            </div>
            <p className="text-[11px] text-zinc-400 font-body leading-relaxed">
              As an authorized platform admin, you can manually override this store&apos;s active subscription tier without payment confirmations.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 block font-heading uppercase">Plan Tier</label>
                <select
                  value={adminPlan}
                  onChange={(e: any) => setAdminPlan(e.target.value as PlanTier)}
                  className="w-full h-9 bg-black border border-white/10 rounded-xl px-3 text-xs text-white"
                >
                  {effectivePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.priceMonthly})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 block font-heading uppercase">Validity (Days)</label>
                <select
                  value={adminExpiryDays}
                  onChange={(e: any) => setAdminExpiryDays(Number(e.target.value))}
                  className="w-full h-9 bg-black border border-white/10 rounded-xl px-3 text-xs text-white"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>

              <Button
                onClick={handleAdminOverride}
                disabled={isUpdatingAdmin}
                className="bg-maroon-800 hover:bg-maroon-700 text-white font-bold h-9 text-xs"
              >
                {isUpdatingAdmin ? "Applying Override..." : "Apply Override"}
              </Button>
            </div>
          </Card>
        )}

        {/* Upgrade/Change Plans Grid (All 4 Plans) */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold font-heading uppercase tracking-wider text-zinc-500">
              Available Platform Plans
            </h3>

            {/* Monthly / Annual Toggle */}
            <div className="bg-[#111111] p-1 rounded-2xl border border-white/10 flex items-center gap-1 self-start sm:self-auto">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all",
                  billingInterval === "monthly"
                    ? "bg-maroon-800 text-white shadow-glow"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("annual")}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all flex items-center gap-1",
                  billingInterval === "annual"
                    ? "bg-maroon-800 text-white shadow-glow"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <span>Annual</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-1 py-0.2 rounded font-mono">
                  -17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {effectivePlans.map((p) => {
              const isCurrent = subscription?.plan === p.id && subscription.status === "active";
              const isDowngrade = p.hierarchyWeight < currentPlanWeight;
              const isAnnual = billingInterval === "annual";
              const displayPrice = isAnnual ? `₹${p.priceAnnual.toLocaleString("en-IN")}/yr` : `₹${p.priceMonthly.toLocaleString("en-IN")}/mo`;

              let buttonLabel = `Upgrade to ${p.name}`;
              let buttonDisabled = false;

              if (isCurrent) {
                buttonLabel = "Current Plan";
                buttonDisabled = true;
              } else if (isDowngrade) {
                buttonLabel = "Included in Active Plan";
                buttonDisabled = true;
              } else {
                buttonDisabled = processingUpgrade !== null;
              }

              return (
                <Card
                  key={p.id}
                  className={cn(
                    "p-6 bg-[#111111] border-white/10 flex flex-col justify-between space-y-4 rounded-2xl transition-all",
                    isCurrent && "border-maroon-700/80 shadow-glow"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold font-heading text-white">{p.name}</h4>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-maroon-400 shrink-0" />}
                    </div>
                    <div className="text-lg font-bold font-mono text-white">{displayPrice}</div>
                    {isAnnual && (
                      <p className="text-[10px] text-emerald-400 font-mono">
                        (₹{Math.round(p.priceAnnual / 12)}/mo billed annually)
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 font-body leading-relaxed">{p.description}</p>
                    <span className="text-[10px] font-mono text-zinc-500 block pt-1">
                      Max Products limit: {p.productLimit}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <Button
                      onClick={() => handleRequestUpgrade(p.id)}
                      variant={isCurrent ? "outline" : isDowngrade ? "ghost" : "primary"}
                      disabled={buttonDisabled}
                      isLoading={processingUpgrade === p.id}
                      className={cn(
                        "w-full justify-center text-xs h-9 font-semibold",
                        isDowngrade && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {buttonLabel}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment History Log */}
        <div className="space-y-3.5 mt-8">
          <h3 className="text-xs font-bold font-heading uppercase tracking-wider text-zinc-500">
            Payment History Log
          </h3>
          <Card className="bg-[#111111] border-white/10 overflow-hidden rounded-2xl">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                No past transactions recorded for this store.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-zinc-400">
                  <thead className="bg-white/5 text-[10px] text-zinc-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Transaction ID</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-zinc-300">
                          {new Date(pay.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white uppercase">{getPlanDisplayName(pay.plan)}</td>
                        <td className="px-4 py-3 text-zinc-500 truncate max-w-[150px]">{pay.razorpay_payment_id || "N/A"}</td>
                        <td className="px-4 py-3 text-white">₹{pay.amount}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] uppercase font-bold text-emerald-400">
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
