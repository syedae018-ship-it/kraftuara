import { Coupon, CreateCouponInput, UpdateCouponInput } from "@/types/coupon";

export interface ICouponRepository {
  getAll(storeId: string, client?: any): Promise<Coupon[]>;
  getById(id: string, client?: any): Promise<Coupon | null>;
  getByCode(storeId: string, code: string, client?: any): Promise<Coupon | null>;
  create(storeId: string, input: CreateCouponInput, client?: any): Promise<Coupon>;
  update(id: string, input: UpdateCouponInput, client?: any): Promise<Coupon | null>;
  delete(id: string, client?: any): Promise<boolean>;
  validateCoupon(storeId: string, code: string, subtotal: number, client?: any): Promise<{ success: boolean; discountAmount: number; error?: string; coupon?: Coupon }>;
}

export { supabaseCouponRepository as couponRepository } from "./supabase/supabase-coupon-repository";
