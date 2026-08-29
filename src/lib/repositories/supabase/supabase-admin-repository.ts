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
import type { IAdminRepository } from "@/lib/repositories/admin-repository";
import {
  getAdminOverviewMetricsAction,
  getAdminUsersAction,
  updateUserStatusAction,
  getAdminStoresAction,
  updateStoreStatusAction,
  getAdminPaymentsAction,
  getAdminCatalogOrdersAction,
  getPlatformPromoCodesAction,
  createPlatformPromoCodeAction,
  getThemeTemplatesAction,
  createThemeTemplateAction,
} from "@/lib/actions/admin";

export class SupabaseAdminRepository implements IAdminRepository {
  async getStats(): Promise<PlatformStats> {
    const res = await getAdminOverviewMetricsAction();
    if (res.success && res.data) {
      return res.data;
    }
    return {
      totalUsers: 0,
      activeStores: 0,
      liveStores: 0,
      totalProducts: 0,
      creativeOrders: 0,
      totalRevenue: 0,
      mrr: 0,
      growthPercent: 0,
      platformHealth: "optimal",
      totalSubscribers: 0,
      activeSubscriptions: 0,
      trialUsers: 0,
      expiredSubscriptions: 0,
      cancelledSubscriptions: 0,
      successfulPaymentsCount: 0,
      failedPaymentsCount: 0,
      planStarterCount: 0,
      planProCount: 0,
      planBusinessCount: 0,
    };
  }

  async getUsers(): Promise<AdminUser[]> {
    const res = await getAdminUsersAction();
    return res.success && res.data ? res.data : [];
  }

  async updateUserStatus(userId: string, status: AdminUser["status"]): Promise<AdminUser> {
    const targetStatus = status === "suspended" ? "suspended" : "active";
    const res = await updateUserStatusAction(userId, targetStatus);
    if (!res.success) {
      throw new Error(res.error || "Failed to update user status");
    }
    const all = await this.getUsers();
    const updated = all.find((u) => u.id === userId);
    if (!updated) {
      return {
        id: userId,
        name: "Merchant User",
        email: "",
        plan: "Startup Plan",
        storeName: "",
        storeSlug: "",
        createdAt: new Date().toISOString(),
        status,
      };
    }
    return updated;
  }

  async getStores(): Promise<AdminStore[]> {
    const res = await getAdminStoresAction();
    return res.success && res.data ? res.data : [];
  }

  async updateStoreStatus(storeId: string, status: AdminStore["status"]): Promise<AdminStore> {
    const res = await updateStoreStatusAction(storeId, status);
    if (!res.success) {
      throw new Error(res.error || "Failed to update store status");
    }
    const all = await this.getStores();
    const updated = all.find((s) => s.id === storeId);
    if (!updated) {
      return {
        id: storeId,
        name: "Store",
        slug: "",
        ownerName: "Merchant Owner",
        ownerEmail: "",
        productCount: 0,
        plan: "Startup Plan",
        status,
        themeName: "Bloom Theme",
        createdAt: new Date().toISOString(),
      };
    }
    return updated;
  }

  async getTemplates(): Promise<Template[]> {
    const res = await getThemeTemplatesAction();
    return res.success && res.data ? res.data : [];
  }

  async createTemplate(input: Omit<Template, "id" | "activeStoresCount">): Promise<Template> {
    const res = await createThemeTemplateAction(input);
    if (!res.success) {
      throw new Error(res.error || "Failed to create template");
    }
    return res.data;
  }


  async getPlans(): Promise<Plan[]> {
    return [
      {
        id: "startup",
        name: "Startup Pack",
        price: 99,
        interval: "monthly",
        limits: { products: 30, storageGb: 5, customDomain: false },
        features: ["Standard Support", "Bloom Theme System", "WhatsApp Checkout", "Subdomain"],
        status: "active",
      },
      {
        id: "growth",
        name: "Growth Pack",
        price: 299,
        interval: "monthly",
        limits: { products: 150, storageGb: 20, customDomain: true },
        features: ["Priority Support", "Custom Domain", "Creative Hub", "Advanced Analytics"],
        isPopular: true,
        status: "active",
      },
      {
        id: "pro",
        name: "Pro Plan",
        price: 499,
        interval: "monthly",
        limits: { products: 500, storageGb: 100, customDomain: true },
        features: ["Dedicated Support", "Unlimited Products", "Custom CSS", "VIP Creative Services"],
        status: "active",
      },
    ];
  }

  async createPlan(input: Omit<Plan, "id">): Promise<Plan> {
    throw new Error("Plan modification should be done through feature gating definitions.");
  }

  async getCoupons(): Promise<Coupon[]> {
    const res = await getPlatformPromoCodesAction();
    return res.success && res.data ? res.data : [];
  }

  async createCoupon(input: Omit<Coupon, "id" | "usageCount">): Promise<Coupon> {
    const res = await createPlatformPromoCodeAction(input);
    if (!res.success) {
      throw new Error(res.error || "Failed to create coupon");
    }
    return res.data;
  }


  async getSupportTickets(): Promise<SupportTicket[]> {
    return [];
  }

  async updateTicketStatus(ticketId: string, status: SupportTicket["status"]): Promise<void> {
    // Ticket status update
  }

  async getPayments(): Promise<AdminPayment[]> {
    const res = await getAdminPaymentsAction();
    return res.success && res.data ? res.data : [];
  }

  async getCatalogOrders(): Promise<any[]> {
    const res = await getAdminCatalogOrdersAction();
    return res.success && res.data ? res.data : [];
  }
}

export const supabaseAdminRepository = new SupabaseAdminRepository();
