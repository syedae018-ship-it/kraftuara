"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Ticket, Plus, Calendar, Tag, Trash2, ShieldAlert, Check } from "lucide-react";
import { Badge } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { getPlanDisplayName } from "@/lib/feature-gating";
import {
  getCouponsAction,
  createCouponAction,
  updateCouponAction,
  deleteCouponAction,
} from "@/lib/actions/coupon";
import { Coupon } from "@/types/coupon";
import { formatCurrency } from "@/lib/utils";

export default function MerchantCouponsPage() {
  const { activeStore } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [value, setValue] = useState("10");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [expiryDate, setExpiryDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCoupons() {
      if (!activeStore?.id) return;
      setIsLoading(true);
      const res = await getCouponsAction(activeStore.id);
      if (res.success && res.coupons) {
        setCoupons(res.coupons);
      } else {
        toast.error("Error", res.error || "Failed to load coupons.");
      }
      setIsLoading(false);
    }
    loadCoupons();
  }, [activeStore]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id || !code.trim()) return;

    setIsSubmitting(true);
    const res = await createCouponAction(activeStore.id, {
      code: code.toUpperCase().trim(),
      discountType,
      value: parseFloat(value) || 10,
      expiryDate: expiryDate || undefined,
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
      status: "active",
    });

    if (res.success && res.coupon) {
      toast.success("Coupon Created", `Promo code "${code.toUpperCase()}" has been created.`);
      setCoupons([res.coupon, ...coupons]);
      setCode("");
      setValue("10");
      setExpiryDate("");
      setUsageLimit("");
      setCreateOpen(false);
    } else {
      toast.error("Error", res.error || "Failed to create coupon.");
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const nextStatus = coupon.status === "active" ? "inactive" : "active";
    const res = await updateCouponAction(coupon.id, { status: nextStatus });
    if (res.success && res.coupon) {
      toast.success("Coupon Updated", `Promo code "${coupon.code}" is now ${nextStatus}.`);
      setCoupons(coupons.map((c) => (c.id === coupon.id ? res.coupon! : c)));
    } else {
      toast.error("Error", res.error || "Failed to update coupon.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) return;
    const res = await deleteCouponAction(id);
    if (res.success) {
      toast.success("Coupon Deleted", "The promo code has been removed.");
      setCoupons(coupons.filter((c) => c.id !== id));
    } else {
      toast.error("Error", res.error || "Failed to delete coupon.");
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Store Dashboard", href: "/dashboard" }, { label: "Coupons" }]}>
      <PlanGate
        requiredPlan="growth"
        featureName="Discount Coupons & Promo Codes"
        description={`Upgrade to the ${getPlanDisplayName("growth")} or ${getPlanDisplayName("pro")} to unlock coupon creation, flat discounts, and percentage promo codes.`}
      >
        <SectionTitle
          title="Promo Codes & Coupons"
          description="Create promotional codes to offer flat-rate or percentage discounts to your store visitors."
          badge={
            <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
              <Ticket className="w-3 h-3 text-maroon-300" /> {coupons.length} Coupons
            </Badge>
          }
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Coupon
            </Button>
          }
        />

        <div className="space-y-6 pb-20 font-body">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-40 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <Card className="p-12 text-center bg-[#111111] border-white/5 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No active coupons</h3>
                <p className="text-xs text-zinc-500">Create your first promo code to boost catalog sales.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Create First Coupon
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <Card
                  key={c.id}
                  className={`p-5 border-white/10 space-y-4 relative overflow-hidden transition-all hover:border-white/20 flex flex-col justify-between ${
                    c.status === "active" ? "bg-[#151214]" : "bg-[#101010] opacity-60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className={`w-4 h-4 ${c.status === "active" ? "text-maroon-400" : "text-zinc-500"}`} />
                        <h4 className="font-mono font-bold text-sm text-white tracking-wider">{c.code}</h4>
                      </div>
                      <Badge variant={c.status === "active" ? "success" : "outline"} className="capitalize text-[10px]">
                        {c.status}
                      </Badge>
                    </div>

                    <div className="text-2xl font-bold font-heading text-white">
                      {c.discountType === "percentage" ? `${c.value}% OFF` : `${formatCurrency(c.value)} OFF`}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="flex flex-col gap-1 text-[11px] text-zinc-400 font-mono">
                      <div className="flex justify-between">
                        <span>Usage Count:</span>
                        <span className="text-white font-bold">{c.usageCount} {c.usageLimit ? `/ ${c.usageLimit}` : ""}</span>
                      </div>
                      {c.expiryDate && (
                        <div className="flex justify-between">
                          <span>Expires:</span>
                          <span className="text-white font-bold">{new Date(c.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(c)}
                        className={`text-[10px] h-7 px-2.5 ${
                          c.status === "active"
                            ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                            : "border-maroon-900 text-maroon-300 hover:bg-maroon-950/20"
                        }`}
                      >
                        {c.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                        className="border-red-950/60 text-red-400 hover:bg-red-950/20 h-7 w-7 p-0 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Store Promo Code" maxWidth="md">
          <form onSubmit={handleCreate} className="space-y-4 font-body text-left">
            <Input
              label="Promo Code *"
              placeholder="e.g. FESTIVE20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 font-heading">Discount Type *</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-maroon-600 transition-colors"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <Input
                label="Discount Value *"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Usage Limit (Optional)"
                type="number"
                placeholder="e.g. 100"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
              <Input
                label="Expiry Date (Optional)"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="pt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Create Coupon
              </Button>
            </div>
          </form>
        </Modal>
      </PlanGate>
    </DashboardLayout>
  );
}
