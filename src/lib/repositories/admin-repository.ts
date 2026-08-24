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

const mockStats: PlatformStats = {
  totalUsers: 148,
  activeStores: 112,
  liveStores: 94,
  totalProducts: 1420,
  creativeOrders: 48,
  totalRevenue: 34850.00,
  mrr: 12400.00,
  growthPercent: 24.5,
  platformHealth: "optimal",
};

const mockUsers: AdminUser[] = [
  { id: "usr-1", name: "Syed Mustafa", email: "syed@aroma.com", plan: "Pro Plan", storeName: "Aroma Perfumes", storeSlug: "aroma-perfumes", createdAt: "2026-01-10T10:00:00Z", status: "active", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" },
  { id: "usr-2", name: "Royal Fashion Group", email: "contact@royalfashion.io", plan: "Enterprise", storeName: "Royal Fashion", storeSlug: "royal-fashion", createdAt: "2026-01-15T14:30:00Z", status: "active", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
  { id: "usr-3", name: "Al Noor Organics", email: "info@alnoor.com", plan: "Basic Plan", storeName: "Al Noor Electronics", storeSlug: "al-noor-electronics", createdAt: "2026-01-20T09:15:00Z", status: "active" },
  { id: "usr-4", name: "Tariq Perfumes", email: "tariq@perfumes.me", plan: "Free Trial", storeName: "Tariq Attars", storeSlug: "tariq-attars", createdAt: "2026-02-01T12:00:00Z", status: "suspended" },
];

const mockStores: AdminStore[] = [
  { id: "str-1", name: "Aroma Perfumes", slug: "aroma-perfumes", ownerName: "Syed Mustafa", ownerEmail: "syed@aroma.com", productCount: 24, plan: "Pro Plan", status: "live", themeName: "Luxury Oud Dark", createdAt: "2026-01-10T10:00:00Z" },
  { id: "str-2", name: "Royal Fashion", slug: "royal-fashion", ownerName: "Royal Fashion Group", ownerEmail: "contact@royalfashion.io", productCount: 86, plan: "Enterprise", status: "live", themeName: "Fashion Elegance", createdAt: "2026-01-15T14:30:00Z" },
  { id: "str-3", name: "Al Noor Electronics", slug: "al-noor-electronics", ownerName: "Al Noor Organics", ownerEmail: "info@alnoor.com", productCount: 12, plan: "Basic Plan", status: "draft", themeName: "Minimal Pure", createdAt: "2026-01-20T09:15:00Z" },
];

const mockTemplates: Template[] = [
  { id: "tmpl-1", name: "Luxury Oud Dark", version: "v2.1", description: "Deep maroon accents tailored for perfumeries.", thumbnail: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600", activeStoresCount: 42, status: "active" },
  { id: "tmpl-2", name: "Minimal Pure", version: "v1.4", description: "Ultra-clean monochrome aesthetic.", thumbnail: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600", activeStoresCount: 28, status: "active" },
  { id: "tmpl-3", name: "Fashion Elegance", version: "v1.8", description: "High-contrast typography for apparel brands.", thumbnail: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600", activeStoresCount: 19, status: "active" },
];

const mockPlans: Plan[] = [
  { id: "plan-1", name: "Starter Tier", price: 29, interval: "monthly", limits: { products: 50, storageGb: 5, customDomain: false }, features: ["Basic Analytics", "Standard Support", "WhatsApp Orders"], status: "active" },
  { id: "plan-2", name: "Pro Luxury Tier", price: 79, interval: "monthly", limits: { products: 500, storageGb: 25, customDomain: true }, features: ["Custom Domain", "Creative Hub Access", "Full Theme Engine", "Priority Support"], isPopular: true, status: "active" },
  { id: "plan-3", name: "Enterprise Suite", price: 249, interval: "monthly", limits: { products: 5000, storageGb: 200, customDomain: true }, features: ["Unlimited Products", "Dedicated Designer", "SLA 99.9%", "API Access"], status: "active" },
];

const mockCoupons: Coupon[] = [
  { id: "coup-1", code: "LAUNCH2026", discountType: "percentage", value: 20, expiryDate: "2026-12-31", usageLimit: 500, usageCount: 142, status: "active" },
  { id: "coup-2", code: "EIDSPECIAL", discountType: "flat", value: 50, expiryDate: "2026-03-31", usageLimit: 100, usageCount: 38, status: "active" },
];

const mockSupportTickets: SupportTicket[] = [
  { id: "tck-101", ticketNumber: "TCK-801", customerName: "Syed Mustafa", customerEmail: "syed@aroma.com", subject: "Custom Domain DNS Setup Assistance", category: "Domain & SSL", priority: "high", status: "open", createdAt: "2026-02-05T09:00:00Z" },
  { id: "tck-102", ticketNumber: "TCK-802", customerName: "Royal Fashion", customerEmail: "contact@royalfashion.io", subject: "WhatsApp Link Auto Formatting Question", category: "Storefront", priority: "medium", status: "in_progress", createdAt: "2026-02-04T16:20:00Z" },
];

const mockPayments: AdminPayment[] = [
  { id: "pay-1", invoiceNumber: "INV-901", customerName: "Syed Mustafa", storeName: "Aroma Perfumes", amount: 79.00, planName: "Pro Luxury Tier", status: "succeeded", createdAt: "2026-02-01T10:00:00Z" },
  { id: "pay-2", invoiceNumber: "INV-902", customerName: "Royal Fashion Group", storeName: "Royal Fashion", amount: 249.00, planName: "Enterprise Suite", status: "succeeded", createdAt: "2026-02-01T11:30:00Z" },
];

class MockAdminRepositoryImpl implements IAdminRepository {
  private users = [...mockUsers];
  private stores = [...mockStores];
  private templates = [...mockTemplates];
  private plans = [...mockPlans];
  private coupons = [...mockCoupons];
  private tickets = [...mockSupportTickets];

  async getStats(): Promise<PlatformStats> {
    return { ...mockStats };
  }

  async getUsers(): Promise<AdminUser[]> {
    return [...this.users];
  }

  async updateUserStatus(userId: string, status: AdminUser["status"]): Promise<AdminUser> {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], status };
      return this.users[idx];
    }
    throw new Error("User not found");
  }

  async getStores(): Promise<AdminStore[]> {
    return [...this.stores];
  }

  async updateStoreStatus(storeId: string, status: AdminStore["status"]): Promise<AdminStore> {
    const idx = this.stores.findIndex((s) => s.id === storeId);
    if (idx !== -1) {
      this.stores[idx] = { ...this.stores[idx], status };
      return this.stores[idx];
    }
    throw new Error("Store not found");
  }

  async getTemplates(): Promise<Template[]> {
    return [...this.templates];
  }

  async createTemplate(input: Omit<Template, "id" | "activeStoresCount">): Promise<Template> {
    const created: Template = { ...input, id: `tmpl-${Date.now()}`, activeStoresCount: 0 };
    this.templates.unshift(created);
    return created;
  }

  async getPlans(): Promise<Plan[]> {
    return [...this.plans];
  }

  async createPlan(input: Omit<Plan, "id">): Promise<Plan> {
    const created: Plan = { ...input, id: `plan-${Date.now()}` };
    this.plans.unshift(created);
    return created;
  }

  async getCoupons(): Promise<Coupon[]> {
    return [...this.coupons];
  }

  async createCoupon(input: Omit<Coupon, "id" | "usageCount">): Promise<Coupon> {
    const created: Coupon = { ...input, id: `coup-${Date.now()}`, usageCount: 0 };
    this.coupons.unshift(created);
    return created;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return [...this.tickets];
  }

  async updateTicketStatus(ticketId: string, status: SupportTicket["status"]): Promise<void> {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = status;
  }

  async getPayments(): Promise<AdminPayment[]> {
    return [...mockPayments];
  }

  async getCatalogOrders(): Promise<any[]> {
    return [];
  }
}

import { supabaseAdminRepository } from "./supabase/supabase-admin-repository";

function checkSupabaseConfigured() {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
    return false;
  }
  if (typeof window === "undefined") {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && url !== "https://placeholder-url.supabase.co" && key && key !== "placeholder-anon-key");
}

export const adminRepository: IAdminRepository = checkSupabaseConfigured()
  ? supabaseAdminRepository
  : new MockAdminRepositoryImpl();
