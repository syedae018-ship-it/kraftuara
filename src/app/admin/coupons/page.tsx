"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CouponCard } from "@/components/admin/coupon-card";
import { Coupon } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Badge } from "@/components/ui/table";
import { Ticket } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const c = await adminRepository.getCoupons();
      setCoupons(c);
    } catch (err: any) {
      console.error("[AdminCouponsPage] Failed to load promo codes from database:", err);
      setError("Unable to load promo codes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCoupon = async (input: Omit<Coupon, "id" | "usageCount">) => {
    await adminRepository.createCoupon(input);
    // Immediately re-fetch from Supabase to guarantee single source of truth
    await loadData();
  };

  const handleCouponUpdated = async () => {
    await loadData();
  };

  const handleCouponDeleted = async () => {
    await loadData();
  };

  const activeCount = coupons.filter((c) => c.status === "active").length;

  return (
    <AdminLayout>
      <SectionTitle
        title="Promo Codes & SaaS Discounts"
        description="Issue promotional discount codes, flat discounts, and usage limits for subscription plans."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Ticket className="w-3 h-3 text-maroon-300" /> {activeCount} Active Codes
          </Badge>
        }
      />

      <div className="pb-20">
        <CouponCard
          coupons={coupons}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          onCreateCoupon={handleCreateCoupon}
          onCouponUpdated={handleCouponUpdated}
          onCouponDeleted={handleCouponDeleted}
        />
      </div>
    </AdminLayout>
  );
}

