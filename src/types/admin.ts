export type UserStatus = "active" | "suspended" | "pending";

export type StoreStatus = "live" | "draft" | "suspended";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: string;
  storeName: string;
  storeSlug: string;
  createdAt: string;
  status: UserStatus;
};

export type AdminStore = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  ownerName: string;
  ownerEmail: string;
  productCount: number;
  plan: string;
  status: StoreStatus;
  themeName: string;
  createdAt: string;
};

export type PlatformStats = {
  totalUsers: number;
  activeStores: number;
  liveStores: number;
  totalProducts: number;
  creativeOrders: number;
  totalRevenue: number;
  mrr: number;
  growthPercent: number;
  platformHealth: "optimal" | "degraded";
  
  // Platform Subscription Billing metrics
  totalSubscribers?: number;
  activeSubscriptions?: number;
  trialUsers?: number;
  expiredSubscriptions?: number;
  cancelledSubscriptions?: number;
  successfulPaymentsCount?: number;
  failedPaymentsCount?: number;
  planStarterCount?: number;
  planProCount?: number;
  planBusinessCount?: number;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  limits: {
    products: number;
    storageGb: number;
    customDomain: boolean;
  };
  features: string[];
  isPopular?: boolean;
  status: "active" | "archived";
};

export type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "flat";
  value: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  status: "active" | "expired" | "disabled";
};

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
};

export type Template = {
  id: string;
  name: string;
  version: string;
  description: string;
  thumbnail: string;
  activeStoresCount: number;
  status: "active" | "disabled" | "archived";
};

export type AdminPayment = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  storeName: string;
  amount: number;
  planName: string;
  status: "succeeded" | "pending" | "failed";
  createdAt: string;
};
