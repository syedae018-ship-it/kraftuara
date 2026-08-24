"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { SectionTitle } from "@/components/dashboard/section-title";
import { CouponCard } from "@/components/admin/coupon-card";
import { Coupon } from "@/types/admin";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Badge } from "@/components/ui/table";
import { Ticket } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    async function loadData() {
      const c = await adminRepository.getCoupons();
      setCoupons(c);
    }
    loadData();
  }, []);

  const handleCreateCoupon = async (input: Omit<Coupon, "id" | "usageCount">) => {
    const created = await adminRepository.createCoupon(input);
    setCoupons([created, ...coupons]);
  };

  return (
    <AdminLayout>
      <SectionTitle
        title="Promo Codes & Discount Coupons"
        description="Issue promotional discount codes, flat discounts, and usage limits."
        badge={
          <Badge variant="maroon" className="gap-1 font-mono text-[11px]">
            <Ticket className="w-3 h-3 text-maroon-300" /> {coupons.length} Active Coupons
          </Badge>
        }
      />

      <div className="pb-20">
        <CouponCard coupons={coupons} onCreateCoupon={handleCreateCoupon} />
      </div>
    </AdminLayout>
  );
}
