"use client";

import React, { useState } from "react";
import { Coupon } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Ticket, Plus, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

export interface CouponCardProps {
  coupons: Coupon[];
  onCreateCoupon: (input: Omit<Coupon, "id" | "usageCount">) => void;
}

export function CouponCard({ coupons, onCreateCoupon }: CouponCardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("20");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [usageLimit, setUsageLimit] = useState("100");

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

  return (
    <div className="space-y-6 font-body">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Create New Promo Code
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <Card key={c.id} className="p-5 bg-[#151515] border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-maroon-400" />
                <h4 className="font-mono font-bold text-sm text-white">{c.code}</h4>
              </div>
              <Badge variant="success" className="capitalize text-[10px]">{c.status}</Badge>
            </div>

            <div className="flex items-baseline gap-1 text-2xl font-bold font-heading text-white">
              {c.discountType === "percentage" ? `${c.value}% OFF` : `$${c.value} OFF`}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono border-t border-white/5 pt-2">
              <span>Usage: {c.usageCount} / {c.usageLimit}</span>
              <span>Expires: {c.expiryDate}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Discount Promo Code" maxWidth="md">
        <form onSubmit={handleCreate} className="space-y-4 font-body">
          <Input label="Coupon Code" placeholder="e.g. SUMMER2026" value={code} onChange={(e) => setCode(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 font-heading">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Dollar ($)</option>
              </select>
            </div>
            <Input label="Discount Value" type="number" value={value} onChange={(e) => setValue(e.target.value)} required />
          </div>
          <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Coupon</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
