"use server";

import { createServerInstance } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/services/admin-roles";

// Simple UUID regex validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface EventPayload {
  storeId: string;
  eventType: string;
  sessionId: string;
  visitorId: string;
  productId?: string;
  pagePath: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  deviceType?: string;
}

export async function trackStorefrontEventAction(payload: EventPayload) {
  try {
    const {
      storeId,
      eventType,
      sessionId,
      visitorId,
      productId,
      pagePath,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      deviceType,
    } = payload;

    if (!storeId || !UUID_REGEX.test(storeId)) {
      throw new Error("Invalid Store ID format.");
    }

    const ALLOWED_EVENTS = ["page_view", "product_view", "add_to_cart", "order_conversion"];
    if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
      throw new Error("Invalid event type.");
    }

    if (!sessionId || !visitorId) {
      throw new Error("Missing visitor or session identifier.");
    }

    if (productId && !UUID_REGEX.test(productId)) {
      throw new Error("Invalid Product ID format.");
    }

    const supabase = await createServerInstance();

    const { data: storeRow, error: storeError } = await (supabase.from("stores") as any)
      .select("id")
      .eq("id", storeId)
      .maybeSingle();

    if (storeError || !storeRow) {
      throw new Error("Store does not exist.");
    }

    if (productId) {
      const { data: productRow, error: productError } = await (supabase.from("products") as any)
        .select("id, store_id")
        .eq("id", productId)
        .maybeSingle();

      if (productError || !productRow) {
        throw new Error("Product does not exist.");
      }
      if (productRow.store_id !== storeId) {
        throw new Error("Product does not belong to the specified store.");
      }
    }

    const { error: insertError } = await (supabase.from("storefront_events") as any).insert({
      store_id: storeId,
      event_type: eventType,
      session_id: sessionId.substring(0, 100),
      visitor_id: visitorId.substring(0, 100),
      product_id: productId || null,
      page_path: pagePath.substring(0, 500),
      referrer: referrer ? referrer.substring(0, 500) : null,
      utm_source: utmSource ? utmSource.substring(0, 100) : null,
      utm_medium: utmMedium ? utmMedium.substring(0, 100) : null,
      utm_campaign: utmCampaign ? utmCampaign.substring(0, 100) : null,
      utm_term: utmTerm ? utmTerm.substring(0, 100) : null,
      utm_content: utmContent ? utmContent.substring(0, 100) : null,
      device_type: deviceType ? deviceType.substring(0, 50) : null,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Event tracking failed:", err);
    return { success: false, error: err.message || "Failed to record analytics event." };
  }
}

function getChannelGroup(utmSource?: string | null, referrer?: string | null): string {
  const src = (utmSource || "").toLowerCase();
  const ref = (referrer || "").toLowerCase();

  if (src.includes("instagram") || src === "ig" || ref.includes("instagram.com")) {
    return "Instagram Storefront";
  }
  if (src.includes("whatsapp") || src === "wa" || ref.includes("wa.me") || ref.includes("whatsapp.com")) {
    return "WhatsApp Share";
  }
  if (src.includes("google") || ref.includes("google.com") || ref.includes("google.co")) {
    return "Google Organic Search";
  }
  if (!utmSource && !referrer) {
    return "Direct Visits";
  }
  return "Referrals & Others";
}

export interface AnalyticsSummary {
  views: number;
  visitors: number;
  productViews: number;
  addToCarts: number;
  ordersCount: number;
  totalRevenue: number;
  conversionRate: string;
  dailyTrend: Array<{
    date: string;
    dayLabel: string;
    views: number;
    visitors: number;
    orders: number;
    revenue: number;
  }>;
  trafficSources: Array<{
    name: string;
    percentage: number;
    count: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    views: number;
  }>;
}

function getEmptySummary(timeRange: "7D" | "30D" | "90D" = "7D"): AnalyticsSummary {
  const days = timeRange === "7D" ? 7 : timeRange === "30D" ? 30 : 90;
  const trend = Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      date: d.toISOString().split("T")[0],
      dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
      views: 0,
      visitors: 0,
      orders: 0,
      revenue: 0,
    };
  });
  return {
    views: 0,
    visitors: 0,
    productViews: 0,
    addToCarts: 0,
    ordersCount: 0,
    totalRevenue: 0,
    conversionRate: "0.0",
    dailyTrend: trend,
    trafficSources: [],
    topProducts: [],
  };
}

export async function getStoreAnalyticsAction(storeId: string, range: "7D" | "30D" | "90D" = "7D"): Promise<{ success: boolean; analytics?: AnalyticsSummary; error?: string }> {
  try {
    if (!storeId || !UUID_REGEX.test(storeId)) {
      throw new Error("Invalid Store ID.");
    }

    let daysCount = 7;
    if (range === "30D") daysCount = 30;
    if (range === "90D") daysCount = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    const startDateStr = startDate.toISOString();

    const supabase = await createServerInstance();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    if (!isAdminUser(user.email || "")) {
      const { data: ownership } = await (supabase.from("stores") as any)
        .select("id")
        .eq("id", storeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ownership) {
        throw new Error("Access Denied: You do not own this store.");
      }
    }

    const { data: rawEvents, error: eventsError } = await (supabase.from("storefront_events") as any)
      .select("*")
      .eq("store_id", storeId)
      .gte("created_at", startDateStr);

    if (eventsError) throw new Error("Failed to load events data from database.");

    const events = rawEvents || [];

    const { data: rawOrders, error: ordersError } = await (supabase.from("orders") as any)
      .select("id, total_amount, created_at")
      .eq("store_id", storeId)
      .gte("created_at", startDateStr)
      .not("status", "eq", "cancelled");

    if (ordersError) throw new Error("Failed to load orders data from database.");

    const ordersData = rawOrders || [];

    const { data: productsData } = await (supabase.from("products") as any)
      .select("id, name")
      .eq("store_id", storeId);
      
    const productMap: Record<string, string> = {};
    if (productsData) {
      productsData.forEach((p: any) => {
        productMap[p.id] = p.name;
      });
    }

    const summary = getEmptySummary(range);
    const uniqueVisitors = new Set<string>();

    const dailyTrendMap: Record<string, typeof summary.dailyTrend[0]> = {};
    summary.dailyTrend.forEach((d) => {
      dailyTrendMap[d.date] = d;
    });

    const trafficMap: Record<string, number> = {};
    const productViewsMap: Record<string, number> = {};

    for (const ev of events) {
      const dayStr = (ev.created_at || "").split("T")[0];
      const trendRow = dailyTrendMap[dayStr];
      const isUniqueVisitor = !uniqueVisitors.has(ev.visitor_id);
      uniqueVisitors.add(ev.visitor_id);

      if (trendRow && isUniqueVisitor) trendRow.visitors++;

      if (ev.event_type === "page_view" || ev.event_type === "product_view") {
        summary.views++;
        if (trendRow) trendRow.views++;

        const channel = getChannelGroup(ev.utm_source, ev.referrer);
        trafficMap[channel] = (trafficMap[channel] || 0) + 1;
      }

      if (ev.event_type === "product_view") {
        summary.productViews++;
        if (ev.product_id) {
          productViewsMap[ev.product_id] = (productViewsMap[ev.product_id] || 0) + 1;
        }
      }

      if (ev.event_type === "add_to_cart") {
        summary.addToCarts++;
      }
    }

    for (const ord of ordersData) {
      const dayStr = (ord.created_at || "").split("T")[0];
      const trendRow = dailyTrendMap[dayStr];
      const amount = Number(ord.total_amount) || 0;

      summary.ordersCount++;
      summary.totalRevenue += amount;

      if (trendRow) {
        trendRow.orders++;
        trendRow.revenue += amount;
      }
    }

    summary.visitors = uniqueVisitors.size;

    if (summary.visitors > 0) {
      summary.conversionRate = ((summary.ordersCount / summary.visitors) * 100).toFixed(2);
    } else {
      summary.conversionRate = "0.00";
    }

    const totalTraffic = Object.values(trafficMap).reduce((a, b) => a + b, 0);
    summary.trafficSources = Object.entries(trafficMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalTraffic > 0 ? Math.round((count / totalTraffic) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    summary.topProducts = Object.entries(productViewsMap)
      .map(([id, views]) => ({
        id,
        name: productMap[id] || "Unknown Product",
        views,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return { success: true, analytics: summary };
  } catch (err: any) {
    console.error("Failed to compile analytics:", err);
    return { success: false, error: err.message || "Failed to compile analytics" };
  }
}
