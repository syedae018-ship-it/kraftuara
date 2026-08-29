"use client";

import React, { useState } from "react";
import { Coupon } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { deletePlatformPromoCodeAction } from "@/lib/actions/admin";

export interface CouponCardProps {
  coupons: Coupon[];
  onCreateCoupon: (input: Omit<Coupon, "id" | "usageCount">) => void;
  onCouponDeleted?: (codeId: string) => void;
}

export function CouponCard({ coupons, onCreateCoupon, onCouponDeleted }: CouponCardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("20");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [usageLimit, setUsageLimit] = useState("100");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    onCreateCoupon({
      code: code.toUpperCase().trim(),
      discountType,
      value: parseFloat(value) || 20,
      expiryDate,
      usageLimit: parseInt(usageLimit) || 100,
      status: "active",
    });

    toast.success("Coupon Created", `Promo code "${code.toUpperCase()}" added.`);
    setCode("");
    setCreateOpen(false);
  };

  const handleDelete = async (couponId: string, couponCode: string) => {
    setDeletingId(couponId);
    try {
      const res = await deletePlatformPromoCodeAction(couponId);
      if (res.success) {
        toast.success("Promo Code Deleted", `Code "${couponCode}" removed.`);
        onCouponDeleted?.(couponId);
      } else {
        toast.error("Failed", res.error || "Could not delete promo code.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Create SaaS Promo Code
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-12 text-center bg-[#151515] font-body text-zinc-500">
          <p className="text-sm font-semibold">No active SaaS promo codes created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <Card key={c.id} className="p-5 bg-[#151515] border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-maroon-400" />
                  <h4 className="font-mono font-bold text-sm text-white">{c.code}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="capitalize text-[10px]">{c.status}</Badge>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.code)}
                    disabled={deletingId === c.id}
                    className="text-zinc-500 hover:text-rose-400 p-1 transition-colors disabled:opacity-50"
                    title="Delete Promo Code"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-1 text-2xl font-bold font-heading text-white">
                {c.discountType === "percentage" ? `${c.value}% OFF` : `₹${c.value} OFF`}
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono border-t border-white/5 pt-2">
                <span>Usage: {c.usageCount || 0} / {c.usageLimit || "∞"}</span>
                <span>Expires: {c.expiryDate || "No limit"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create SaaS Promo Code" maxWidth="md">
        <form onSubmit={handleCreate} className="space-y-4 font-body text-left">
          <Input label="Promo Code" placeholder="e.g. KRAFT10" value={code} onChange={(e) => setCode(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 font-heading">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <Input label="Discount Value" type="number" value={value} onChange={(e) => setValue(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            <Input label="Usage Limit" type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Code</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
