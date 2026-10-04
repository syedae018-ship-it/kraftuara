"use client";

import React, { useState, useEffect } from "react";
import { Coupon } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui/table";
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Power,
  PowerOff,
  AlertTriangle,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Percent,
  DollarSign,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  deletePlatformPromoCodeAction,
  togglePlatformPromoCodeStatusAction,
  updatePlatformPromoCodeAction,
} from "@/lib/actions/admin";
import { PlanConfig } from "@/lib/feature-gating";

export interface CouponCardProps {
  coupons: Coupon[];
  onCreateCoupon: (input: Omit<Coupon, "id" | "usageCount">) => Promise<void> | void;
  onCouponUpdated?: (updated: Coupon) => void;
  onCouponDeleted?: (codeId: string) => void;
}

export function CouponCard({
  coupons,
  onCreateCoupon,
  onCouponUpdated,
  onCouponDeleted,
}: CouponCardProps) {
  // Plan options fetched dynamically from existing plan configuration
  const [plans, setPlans] = useState<PlanConfig[]>([]);

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [applicablePlanId, setApplicablePlanId] = useState("all");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [value, setValue] = useState("20");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("100");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editPlanId, setEditPlanId] = useState("all");
  const [editDiscountType, setEditDiscountType] = useState<"percentage" | "flat">("percentage");
  const [editValue, setEditValue] = useState("");
  const [editHasExpiry, setEditHasExpiry] = useState(false);
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editUsageLimit, setEditUsageLimit] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Toggle loading map
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch dynamic SaaS plans
  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPlans(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const openCreateModal = () => {
    setCode("");
    setApplicablePlanId("all");
    setDiscountType("percentage");
    setValue("20");
    setHasExpiry(false);
    setExpiryDate("");
    setUsageLimit("100");
    setStatus("active");
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Validation Error", "Please provide a promo code.");
      return;
    }

    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal <= 0) {
      toast.error("Validation Error", "Please provide a valid discount value greater than 0.");
      return;
    }

    if (discountType === "percentage" && numVal > 100) {
      toast.error("Validation Error", "Percentage discount cannot exceed 100%.");
      return;
    }

    const numLimit = parseInt(usageLimit, 10);
    if (isNaN(numLimit) || numLimit < 1) {
      toast.error("Validation Error", "Maximum uses must be at least 1.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateCoupon({
        code: cleanCode,
        applicablePlanId,
        discountType,
        value: numVal,
        usageLimit: numLimit,
        expiryDate: hasExpiry && expiryDate ? expiryDate : null,
        status,
      });
      setCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditPlanId(coupon.applicablePlanId || "all");
    setEditDiscountType(coupon.discountType || "percentage");
    setEditValue(coupon.value.toString());
    setEditHasExpiry(Boolean(coupon.expiryDate));
    setEditExpiryDate(coupon.expiryDate ? coupon.expiryDate.split("T")[0] : "");
    setEditUsageLimit(coupon.usageLimit.toString());
    setEditStatus(coupon.status === "inactive" ? "inactive" : "active");
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    const numVal = parseFloat(editValue);
    if (isNaN(numVal) || numVal <= 0) {
      toast.error("Validation Error", "Discount value must be greater than 0.");
      return;
    }

    if (editDiscountType === "percentage" && numVal > 100) {
      toast.error("Validation Error", "Percentage discount cannot exceed 100%.");
      return;
    }

    const numLimit = parseInt(editUsageLimit, 10);
    if (isNaN(numLimit) || numLimit < 1) {
      toast.error("Validation Error", "Maximum uses must be at least 1.");
      return;
    }

    if (numLimit < (editingCoupon.usageCount || 0)) {
      toast.error(
        "Validation Error",
        `Maximum uses cannot be less than already used count (${editingCoupon.usageCount}).`
      );
      return;
    }

    setIsUpdating(true);
    try {
      const res = await updatePlatformPromoCodeAction(editingCoupon.id, {
        applicablePlanId: editPlanId,
        discountType: editDiscountType,
        value: numVal,
        usageLimit: numLimit,
        expiryDate: editHasExpiry && editExpiryDate ? editExpiryDate : null,
        status: editStatus,
      });

      if (res.success && res.data) {
        toast.success("Promo Code Updated", `Promo code "${editingCoupon.code}" saved.`);
        onCouponUpdated?.(res.data);
        setEditOpen(false);
      } else {
        const errMsg = !res.success ? res.error : "Could not update promo code.";
        toast.error("Update Failed", errMsg);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    setTogglingId(coupon.id);
    try {
      const res = await togglePlatformPromoCodeStatusAction(coupon.id);
      if (res.success && res.data) {
        toast.success(
          "Status Updated",
          `Promo code "${coupon.code}" is now ${res.data.status}.`
        );
        onCouponUpdated?.(res.data);
      } else {
        const errMsg = !res.success ? res.error : "Could not toggle coupon status.";
        toast.error("Toggle Failed", errMsg);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const openDeleteModal = (coupon: Coupon) => {
    setDeletingCoupon(coupon);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCoupon) return;
    setIsDeleting(true);
    try {
      const res = await deletePlatformPromoCodeAction(deletingCoupon.id);
      if (res.success) {
        toast.success("Promo Code Deleted", `Promo code "${deletingCoupon.code}" permanently deleted.`);
        onCouponDeleted?.(deletingCoupon.id);
        setDeleteOpen(false);
      } else {
        toast.error("Delete Failed", res.error || "Could not delete promo code.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatExpiryDisplay = (expiryDate?: string | null) => {
    if (!expiryDate) return "No Expiry";
    try {
      return new Date(expiryDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return expiryDate;
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white font-heading">
            Configured Promo Codes
          </h3>
          <p className="text-xs text-zinc-400">
            Create plan-specific coupons or global discounts with automated usage tracking.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Promo Code
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-12 text-center bg-[#151515] font-body text-zinc-500">
          <Tag className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-400">No coupons created yet.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Click &ldquo;Create Promo Code&rdquo; above to set up your first plan-specific discount.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Coupon Admin Table */}
          <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-[#151515] font-body">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promo Code</TableHead>
                  <TableHead>Applicable Plan</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Used / Max Uses</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-bold text-white">
                      <span className="px-2 py-1 rounded bg-[#202020] border border-white/10 text-maroon-300">
                        {c.code}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={c.applicablePlanId && c.applicablePlanId !== "all" ? "maroon" : "outline"}
                        className="text-[11px] font-medium"
                      >
                        {c.applicablePlanName || (c.applicablePlanId === "all" ? "All Plans" : c.applicablePlanId)}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-heading font-bold text-white text-sm">
                      {c.discountType === "percentage" ? `${c.value}%` : `₹${c.value}`}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-zinc-300">
                      <span className="font-bold text-white">{c.usageCount || 0}</span> /{" "}
                      <span>{c.usageLimit || "∞"}</span>
                    </TableCell>

                    <TableCell className="text-xs text-zinc-400 font-mono">
                      {formatExpiryDisplay(c.expiryDate)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={c.status === "active" ? "success" : "outline"}
                        className="capitalize text-[10px]"
                      >
                        {c.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                          title="Edit Promo Code"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          disabled={togglingId === c.id}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            c.status === "active"
                              ? "text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10"
                              : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                          }`}
                          title={c.status === "active" ? "Deactivate Promo Code" : "Activate Promo Code"}
                        >
                          {c.status === "active" ? (
                            <PowerOff className="w-3.5 h-3.5" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(c)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                          title="Delete Promo Code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="bg-[#151515] border border-white/10 rounded-2xl p-4 space-y-3 font-body"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#202020] border border-white/10 text-maroon-300">
                    {c.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={c.status === "active" ? "success" : "outline"}
                      className="capitalize text-[10px]"
                    >
                      {c.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-mono">Plan</span>
                    <span className="font-medium text-white text-xs">
                      {c.applicablePlanName || (c.applicablePlanId === "all" ? "All Plans" : c.applicablePlanId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-mono">Discount</span>
                    <span className="font-bold text-white text-xs">
                      {c.discountType === "percentage" ? `${c.value}% OFF` : `₹${c.value} OFF`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-mono">Usage</span>
                    <span className="font-mono text-zinc-300 text-xs">
                      {c.usageCount || 0} / {c.usageLimit || "∞"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-mono">Expires</span>
                    <span className="font-mono text-zinc-300 text-xs">
                      {formatExpiryDisplay(c.expiryDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => openEditModal(c)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleToggleStatus(c)}
                  >
                    {c.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-rose-400 hover:text-rose-300"
                    onClick={() => openDeleteModal(c)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CREATE PROMO CODE MODAL */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Promo Code"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 font-body text-left">
          <Input
            label="Promo Code *"
            placeholder="e.g. SAVE20"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            helperText="Alphanumeric code entered by customers during checkout."
            required
          />

          {/* Applicable Plan Dropdown (Dynamically Loaded) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">
              Applicable Plan *
            </label>
            <select
              value={applicablePlanId}
              onChange={(e) => setApplicablePlanId(e.target.value)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-maroon-500"
            >
              <option value="all">All Plans (Global Discount)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.priceMonthly}/mo)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500">
              Restrict this discount to a single plan tier or allow across all plans.
            </p>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 font-heading">
                Discount Type *
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-maroon-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Fixed Amount (₹)</option>
              </select>
            </div>
            <Input
              label={discountType === "percentage" ? "Discount Percentage (%) *" : "Discount Amount (₹) *"}
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={discountType === "percentage" ? "20" : "50"}
              min="1"
              max={discountType === "percentage" ? "100" : undefined}
              required
            />
          </div>

          {/* Maximum Uses */}
          <Input
            label="Maximum Uses *"
            type="number"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="100"
            min="1"
            helperText="Total number of times this coupon can be redeemed across all checkouts."
            required
          />

          {/* Expiry Configuration */}
          <div className="space-y-2 p-3.5 rounded-xl bg-[#111111] border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold font-heading text-white text-xs">Set Expiry Date</h5>
                <p className="text-[11px] text-zinc-400">Coupon will automatically expire after this date.</p>
              </div>
              <button
                type="button"
                onClick={() => setHasExpiry(!hasExpiry)}
                className={`w-11 h-6 rounded-full transition-colors relative border ${
                  hasExpiry ? "bg-maroon-800 border-maroon-600" : "bg-zinc-800 border-zinc-700"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                    hasExpiry ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {hasExpiry && (
              <div className="pt-2 border-t border-white/10">
                <Input
                  label="Expiration Date *"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required={hasExpiry}
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-maroon-500"
            >
              <option value="active">Active (Available for checkout)</option>
              <option value="inactive">Inactive (Disabled)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Promo Code
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT PROMO CODE MODAL */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit Promo Code: ${editingCoupon?.code}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4 font-body text-left">
          <div className="p-3 rounded-xl bg-[#111111] border border-white/10 flex justify-between items-center text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-mono">Promo Code</span>
              <span className="font-mono font-bold text-white text-sm">{editingCoupon?.code}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block uppercase font-mono">Used Count</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {editingCoupon?.usageCount || 0} times
              </span>
            </div>
          </div>

          {/* Applicable Plan Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">
              Applicable Plan
            </label>
            <select
              value={editPlanId}
              onChange={(e) => setEditPlanId(e.target.value)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-maroon-500"
            >
              <option value="all">All Plans (Global Discount)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.priceMonthly}/mo)
                </option>
              ))}
            </select>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 font-heading">
                Discount Type
              </label>
              <select
                value={editDiscountType}
                onChange={(e) => setEditDiscountType(e.target.value as any)}
                className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-maroon-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Fixed Amount (₹)</option>
              </select>
            </div>
            <Input
              label="Discount Value"
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              min="1"
              max={editDiscountType === "percentage" ? "100" : undefined}
              required
            />
          </div>

          {/* Usage Limit */}
          <Input
            label="Maximum Uses"
            type="number"
            value={editUsageLimit}
            onChange={(e) => setEditUsageLimit(e.target.value)}
            min={editingCoupon?.usageCount ? editingCoupon.usageCount.toString() : "1"}
            helperText={`Must be at least ${editingCoupon?.usageCount || 0} (current used count).`}
            required
          />

          {/* Expiry Configuration */}
          <div className="space-y-2 p-3.5 rounded-xl bg-[#111111] border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold font-heading text-white text-xs">Set Expiry Date</h5>
                <p className="text-[11px] text-zinc-400">Coupon will automatically expire after this date.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditHasExpiry(!editHasExpiry)}
                className={`w-11 h-6 rounded-full transition-colors relative border ${
                  editHasExpiry ? "bg-maroon-800 border-maroon-600" : "bg-zinc-800 border-zinc-700"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                    editHasExpiry ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {editHasExpiry && (
              <div className="pt-2 border-t border-white/10">
                <Input
                  label="Expiration Date"
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  required={editHasExpiry}
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-heading">
              Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-maroon-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Promo Code"
        maxWidth="sm"
      >
        <div className="space-y-4 font-body text-left">
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/30 flex items-start gap-3 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Confirm Deletion</p>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Are you sure you want to permanently delete promo code{" "}
                <span className="font-mono font-bold text-white">&ldquo;{deletingCoupon?.code}&rdquo;</span>?
                Future checkout attempts with this code will fail. Existing successful payments remain unchanged.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
