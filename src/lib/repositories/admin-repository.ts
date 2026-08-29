import {
  AdminUser,
  AdminStore,
  PlatformStats,
  Plan,
  Coupon,
  SupportTicket,
  Template,
  AdminPayment,
} from "@/types/admin";
import { supabaseAdminRepository } from "./supabase/supabase-admin-repository";

export interface IAdminRepository {
  getStats(): Promise<PlatformStats>;
  getUsers(): Promise<AdminUser[]>;
  updateUserStatus(userId: string, status: AdminUser["status"]): Promise<AdminUser>;
  getStores(): Promise<AdminStore[]>;
  updateStoreStatus(storeId: string, status: AdminStore["status"]): Promise<AdminStore>;
  getTemplates(): Promise<Template[]>;
  createTemplate(input: Omit<Template, "id" | "activeStoresCount">): Promise<Template>;
  getPlans(): Promise<Plan[]>;
  createPlan(input: Omit<Plan, "id">): Promise<Plan>;
  getCoupons(): Promise<Coupon[]>;
  createCoupon(input: Omit<Coupon, "id" | "usageCount">): Promise<Coupon>;
  getSupportTickets(): Promise<SupportTicket[]>;
  updateTicketStatus(ticketId: string, status: SupportTicket["status"]): Promise<void>;
  getPayments(): Promise<AdminPayment[]>;
  getCatalogOrders(): Promise<any[]>;
}

export const adminRepository: IAdminRepository = supabaseAdminRepository;
