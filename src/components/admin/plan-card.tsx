"use client";

import React, { useState } from "react";
import { PlanConfig, PlanTier, UNLIMITED_CATEGORY_LIMIT } from "@/lib/feature-gating";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
  Layers,
  Check,
  Edit3,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Package,
  History,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PlanCardProps {
  plans: PlanConfig[];
  onUpdatePlan: (planId: PlanTier, updates: Partial<PlanConfig>) => Promise<boolean>;
  onToggleStatus: (planId: PlanTier, status: "active" | "inactive") => Promise<boolean>;
  auditLogs?: any[];
}

export function PlanCard({ plans, onUpdatePlan, onToggleStatus, auditLogs = [] }: PlanCardProps) {
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMonthly, setPriceMonthly] = useState<number | string>("");
  const [priceAnnual, setPriceAnnual] = useState<number | string>("");
  const [productLimit, setProductLimit] = useState<number | string>("");
  const [isUnlimitedCategories, setIsUnlimitedCategories] = useState(false);
  const [categoryLimit, setCategoryLimit] = useState<number | string>("");
  const [displayOrder, setDisplayOrder] = useState<number | string>(1);
  const [popular, setPopular] = useState(false);
  const [badge, setBadge] = useState("");
  const [isTrialEligible, setIsTrialEligible] = useState(true);
  const [trialDays, setTrialDays] = useState<number | string>(3);
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState("");

  const handleOpenEdit = (plan: PlanConfig) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description);
    setPriceMonthly(plan.priceMonthly);
    setPriceAnnual(plan.priceAnnual);
    setProductLimit(plan.productLimit);
    const unlimCat = plan.categoryLimit >= UNLIMITED_CATEGORY_LIMIT;
    setIsUnlimitedCategories(unlimCat);
    setCategoryLimit(unlimCat ? 1 : plan.categoryLimit);
    setDisplayOrder(plan.displayOrder || 1);
    setPopular(Boolean(plan.popular));
    setBadge(plan.badge || "");
    setIsTrialEligible(plan.isTrialEligible !== false);
    setTrialDays(plan.trialDays || 3);
    setFeaturesList([...plan.featuresDisplay]);
    setNewFeatureInput("");
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFeaturesList([...featuresList, newFeatureInput.trim()]);
    setNewFeatureInput("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== idx));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    if (!name.trim()) {
      toast.error("Validation Error", "Plan name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<PlanConfig> = {
        name: name.trim(),
        description: description.trim(),
        priceMonthly: Number(priceMonthly),
        priceAnnual: Number(priceAnnual),
        productLimit: Number(productLimit),
        categoryLimit: isUnlimitedCategories ? UNLIMITED_CATEGORY_LIMIT : Number(categoryLimit),
        displayOrder: Number(displayOrder),
        popular,
        badge: badge.trim() || undefined,
        isTrialEligible,
        trialDays: Number(trialDays),
        featuresDisplay: featuresList,
      };

      const success = await onUpdatePlan(editingPlan.id, updates);
      if (success) {
        toast.success("Plan Updated", `"${name}" changes have been propagated platform-wide.`);
        setEditingPlan(null);
      }
    } catch (err: any) {
      toast.error("Update Error", err.message || "Failed to update plan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold font-heading text-white">SaaS Plan Catalog ({plans.length})</h3>
          <p className="text-xs text-zinc-400">All pricing, quotas, and entitlements are controlled here as a single source of truth.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAuditLogs(true)}
          leftIcon={<History className="w-3.5 h-3.5 text-zinc-400" />}
          className="text-xs border-white/10"
        >
          View Audit Logs
        </Button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isInactive = p.status === "inactive";
          return (
            <Card
              key={p.id}
              className={cn(
                "p-6 space-y-4 bg-[#151515] border flex flex-col justify-between relative transition-all",
                p.popular ? "border-maroon-600 shadow-glow bg-maroon-950/20" : "border-white/10",
                isInactive && "opacity-60 border-zinc-700 bg-zinc-950/40"
              )}
            >
              {p.popular && !isInactive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-maroon-800 text-white font-heading text-[10px] font-bold uppercase tracking-widest border border-maroon-600/50 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-maroon-300" /> {p.badge || "Most Popular"}
                </span>
              )}

              {isInactive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold uppercase tracking-widest border border-zinc-600">
                  Inactive / Hidden
                </span>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                    Tier ID: {p.id}
                  </span>
                  <Badge
                    className={cn(
                      "text-[9px] py-0.5 uppercase font-mono",
                      !isInactive ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40" : "bg-zinc-800 text-zinc-400"
                    )}
                  >
                    {p.status || "active"}
                  </Badge>
                </div>

                <h4 className="text-lg font-bold font-heading text-white">{p.name}</h4>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-heading text-white">₹{p.priceMonthly}</span>
                  <span className="text-xs text-zinc-400 font-body">/month</span>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                  Annual: ₹{p.priceAnnual}/yr
                </div>

                <p className="text-xs text-zinc-400 font-body leading-relaxed line-clamp-2">
                  {p.description}
                </p>
              </div>

              {/* Limits & Quotas */}
              <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs">
                <div className="text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Package className="w-3 h-3 text-maroon-400" /> Product Limit:
                  </span>
                  <strong className="font-mono text-white">{p.productLimit} items</strong>
                </div>
                <div className="text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Layers className="w-3 h-3 text-maroon-400" /> Category Limit:
                  </span>
                  <strong className="font-mono text-white">
                    {p.categoryLimit >= UNLIMITED_CATEGORY_LIMIT ? "Unlimited" : `${p.categoryLimit} Category`}
                  </strong>
                </div>
                <div className="text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Calendar className="w-3 h-3 text-maroon-400" /> Free Trial:
                  </span>
                  <strong className="font-mono text-emerald-400">
                    {p.isTrialEligible ? `${p.trialDays} Days` : "No Trial"}
                  </strong>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-1.5 pt-3 border-t border-white/10 text-xs text-zinc-300">
                {p.featuresDisplay.slice(0, 5).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 line-clamp-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
                {p.featuresDisplay.length > 5 && (
                  <li className="text-[11px] text-zinc-500 font-mono pt-1">
                    + {p.featuresDisplay.length - 5} more features
                  </li>
                )}
              </ul>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(p)}
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  className="flex-1 text-xs border-white/10"
                >
                  Edit Plan
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleStatus(p.id, isInactive ? "active" : "inactive")}
                  className="px-2.5 text-xs text-zinc-400 hover:text-white"
                  title={isInactive ? "Activate Plan" : "Deactivate Plan"}
                >
                  {isInactive ? <ToggleLeft className="w-4 h-4 text-zinc-500" /> : <ToggleRight className="w-4 h-4 text-emerald-400" />}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <Modal
          isOpen={Boolean(editingPlan)}
          onClose={() => setEditingPlan(null)}
          title={`Edit SaaS Plan: ${editingPlan.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSavePlan} className="space-y-5 font-body max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Plan Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Launch Pack"
                required
              />
              <Input
                label="Badge Text (optional)"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. MOST POPULAR, FULL E-COMMERCE"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 font-heading">Marketing Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-[#111111] border border-white/10 text-white rounded-xl p-2.5 text-xs outline-none focus:border-maroon-600 resize-none font-body"
                placeholder="Describe who this plan is tailored for..."
              />
            </div>

            {/* Pricing Controls */}
            <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold font-heading text-white uppercase tracking-wider">
                Price Configuration (INR ₹)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Monthly Price (₹/month)"
                  type="number"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                  required
                />
                <Input
                  label="Annual Price (₹/year - One-time payment)"
                  type="number"
                  value={priceAnnual}
                  onChange={(e) => setPriceAnnual(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Quotas and Limits */}
            <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold font-heading text-white uppercase tracking-wider">
                Catalog & Quota Limits
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Max Products Limit"
                  type="number"
                  value={productLimit}
                  onChange={(e) => setProductLimit(e.target.value)}
                  required
                />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 font-heading">Category Limit</label>
                    <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimitedCategories}
                        onChange={(e) => setIsUnlimitedCategories(e.target.checked)}
                        className="rounded border-zinc-700 text-maroon-600 focus:ring-0"
                      />
                      Unlimited
                    </label>
                  </div>
                  {!isUnlimitedCategories && (
                    <Input
                      type="number"
                      value={categoryLimit}
                      onChange={(e) => setCategoryLimit(e.target.value)}
                      required={!isUnlimitedCategories}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Trial & Ordering Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Display Order (1-4)"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                required
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 font-heading">Trial Supported?</label>
                <select
                  value={isTrialEligible ? "yes" : "no"}
                  onChange={(e) => setIsTrialEligible(e.target.value === "yes")}
                  className="w-full h-10 bg-[#111111] border border-white/10 text-white rounded-xl px-3 text-xs outline-none focus:border-maroon-600"
                >
                  <option value="yes">Yes (Eligible for Trial)</option>
                  <option value="no">No Trial (Billing Immediate)</option>
                </select>
              </div>
              {isTrialEligible && (
                <Input
                  label="Trial Duration (Days)"
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                />
              )}
            </div>

            {/* Displayed Features Manager */}
            <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-heading text-white uppercase tracking-wider">
                  Marketing Features Display ({featuresList.length})
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. Automated Order Invoicing PDF"
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFeature}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {featuresList.map((feat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {feat}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      title="Remove Feature"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save &amp; Propagate Everywhere
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && (
        <Modal
          isOpen={showAuditLogs}
          onClose={() => setShowAuditLogs(false)}
          title="SaaS Plan Change Audit Log"
          maxWidth="lg"
        >
          <div className="space-y-3 font-body max-h-[70vh] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                No plan audit history recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-xl bg-[#111111] border border-white/10 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                      <span className="text-maroon-400 font-bold uppercase">{log.plan_id}</span>
                      <span>{new Date(log.created_at).toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-white font-semibold">
                      Modified by: <span className="font-mono text-zinc-300">{log.admin_email}</span>
                    </p>
                    <div className="text-[11px] text-zinc-400 font-mono bg-black/60 p-2 rounded-lg mt-1 overflow-x-auto">
                      {JSON.stringify(log.new_values, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAuditLogs(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
