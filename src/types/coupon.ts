export type CouponStatus = "active" | "inactive";

export type Coupon = {
  id: string;
  storeId: string;
  code: string;
  discountType: "percentage" | "flat";
  value: number;
  expiryDate?: string;
  usageLimit?: number;
  usageCount: number;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateCouponInput = Omit<Coupon, "id" | "storeId" | "usageCount" | "createdAt" | "updatedAt">;
export type UpdateCouponInput = Partial<CreateCouponInput>;
