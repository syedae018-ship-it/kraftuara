"use client";

import React, { useState } from "react";
import { Plan } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Layers, Check, Plus, Edit, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PlanCardProps {
  plans: Plan[];
  onCreatePlan: (input: Omit<Plan, "id">) => void;
}

export function PlanCard({ plans, onCreatePlan }: PlanCardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("49");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [productsLimit, setProductsLimit] = useState("100");
  const [storageGb, setStorageGb] = useState("10");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreatePlan({
      name: name.trim(),
      price: parseFloat(price) || 49,
      interval,
      limits: {
        products: parseInt(productsLimit) || 100,
        storageGb: parseInt(storageGb) || 10,
        customDomain: true,
      },
      features: ["Custom Domain Support", "Standard Analytics", "WhatsApp Order Engine"],
      status: "active",
    });

    toast.success("SaaS Plan Created", `Added new plan "${name}".`);
    setName("");
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6 font-body">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Create New Plan Tier
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card
            key={p.id}
            className={cn(
              "p-6 space-y-4 bg-[#151515] border flex flex-col justify-between relative",
              p.isPopular ? "border-maroon-600 shadow-glow bg-maroon-950/20" : "border-white/10"
            )}
          >
            {p.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-maroon-800 text-white font-heading text-[10px] font-bold uppercase tracking-widest border border-maroon-600/50 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-maroon-300" /> Most Popular
              </span>
            )}

            <div className="space-y-2">
              <h4 className="text-lg font-bold font-heading text-white">{p.name}</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-heading text-white">{formatCurrency(p.price)}</span>
                <span className="text-xs text-zinc-500 font-mono">/{p.interval}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
              <div className="text-zinc-300 flex items-center justify-between">
                <span>Products Limit:</span>
                <strong className="font-mono text-white">{p.limits.products} items</strong>
              </div>
              <div className="text-zinc-300 flex items-center justify-between">
                <span>Storage Allowance:</span>
                <strong className="font-mono text-white">{p.limits.storageGb} GB</strong>
              </div>
              <div className="text-zinc-300 flex items-center justify-between">
                <span>Custom Domain:</span>
                <strong className="font-mono text-emerald-400">{p.limits.customDomain ? "Included" : "No"}</strong>
              </div>
            </div>

            <ul className="space-y-1.5 pt-2 border-t border-white/10 text-xs text-zinc-400">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-maroon-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>

            <Button variant="outline" size="sm" className="w-full">
              Edit Plan Specs
            </Button>
          </Card>
        ))}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Subscription Plan" maxWidth="md">
        <form onSubmit={handleCreate} className="space-y-4 font-body">
          <Input label="Plan Name" placeholder="e.g. Agency Unlimited" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monthly Price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <Input label="Max Products Limit" type="number" value={productsLimit} onChange={(e) => setProductsLimit(e.target.value)} required />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Plan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
