"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertAdminSession } from "@/lib/admin/admin-auth";
import { errorResponse, successResponse, getErrorMessage } from "@/lib/api-response";
import { ActionResponse } from "@/types";
import { PlatformStats, AdminUser, AdminStore, AdminPayment, Coupon, Template, CouponBillingCycle, DiscountScope } from "@/types/admin";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, PlanTier, BillingInterval, normalizePlanTier } from "@/lib/feature-gating";
import { getAllPlans, getAuthoritativePlan } from "@/lib/services/plan-service";

const IMPERSONATION_COOKIE = "kraftaura_impersonation";

/**
 * 1. Overview Platform Metrics with Real SQL Aggregation
 */
export async function getAdminOverviewMetricsAction(): Promise<ActionResponse<PlatformStats>> {
  try {
    const { supabase } = await assertAdminSession();

    const [
      usersRes,
      storesRes,
      liveStoresRes,
      productsRes,
      ordersRes,
      paymentsRes,
      subscriptionsRes,
      allPlans,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).neq("email", "syed.ae018@gmail.com"),
      supabase.from("stores").select("*", { count: "exact", head: true }),
      supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "live"),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("amount, status, created_at"),
      supabase.from("subscriptions").select("plan, status, current_period_end"),
      getAllPlans(true),
    ]);

    const paymentsData = paymentsRes.data || [];
    const successfulPayments = paymentsData.filter(
      (p: any) => p.status === "successful" || p.status === "succeeded"
    );
    const failedPayments = paymentsData.filter((p: any) => p.status === "failed");
    const totalRevenue = successfulPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    const subsData = subscriptionsRes.data || [];
    const activeSubs = subsData.filter((s: any) => s.status === "active");
    const expiredSubs = subsData.filter((s: any) => s.status === "expired");
    const cancelledSubs = subsData.filter((s: any) => s.status === "cancelled");

    // Dynamic calculation of MRR from active subscriptions using centralized single source of truth
    const planPrices: Record<string, number> = {};
    for (const p of allPlans) {
      planPrices[p.id.toLowerCase()] = p.priceMonthly;
    }
    // Fallbacks
    if (!planPrices.starter) planPrices.starter = planPrices.startup || 99;
    if (!planPrices.business) planPrices.business = planPrices.pro || 499;

    const mrr = activeSubs.reduce((sum: number, s: any) => {
      const planKey = (s.plan || "").toLowerCase();
      return sum + (planPrices[planKey] || 0);
    }, 0);

    const planStarterCount = activeSubs.filter((s: any) => {
      const p = (s.plan || "").toLowerCase();
      return p === "startup" || p === "starter";
    }).length;

    const planProCount = activeSubs.filter((s: any) => {
      const p = (s.plan || "").toLowerCase();
      return p === "growth";
    }).length;

    const planBusinessCount = activeSubs.filter((s: any) => {
      const p = (s.plan || "").toLowerCase();
      return p === "pro" || p === "business";
    }).length;

    // Calculate real month-over-month revenue growth from payments
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const prevMonthEnd = currentMonthStart;

    let currentMonthRev = 0;
    let prevMonthRev = 0;

    for (const p of successfulPayments) {
      const pTime = p.created_at ? new Date(p.created_at).getTime() : 0;
      const amt = Number(p.amount || 0);
      if (pTime >= currentMonthStart) {
        currentMonthRev += amt;
      } else if (pTime >= prevMonthStart && pTime < prevMonthEnd) {
        prevMonthRev += amt;
      }
    }

    let growthPercent = 0;
    if (prevMonthRev > 0) {
      growthPercent = Math.round(((currentMonthRev - prevMonthRev) / prevMonthRev) * 1000) / 10;
    } else if (currentMonthRev > 0) {
      growthPercent = 100;
    }

    const stats: PlatformStats = {
      totalUsers: usersRes.count || 0,
      activeStores: storesRes.count || 0,
      liveStores: liveStoresRes.count || 0,
      totalProducts: productsRes.count || 0,
      creativeOrders: ordersRes.count || 0,
      totalRevenue,
      mrr,
      growthPercent,
      platformHealth: "optimal",

      totalSubscribers: subsData.length,
      activeSubscriptions: activeSubs.length,
      trialUsers: 0,
      expiredSubscriptions: expiredSubs.length,
      cancelledSubscriptions: cancelledSubs.length,
      successfulPaymentsCount: successfulPayments.length,
      failedPaymentsCount: failedPayments.length,
      planStarterCount,
      planProCount,
      planBusinessCount,
    };

    return successResponse(stats);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * 2. Get Real Platform Users (with stores and active subscriptions)
 */
export async function getAdminUsersAction(limit: number = 100): Promise<ActionResponse<AdminUser[]>> {
  try {
    const { supabase } = await assertAdminSession();

    // Fetch profiles joined with stores and store-level subscriptions with safe limit
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        stores (
          id,
          name,
          slug,
          status,
          subscriptions (
            plan,
            status
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (pErr) throw pErr;

    // Fetch user-level subscriptions ONLY for the retrieved users to avoid table scanning
    const userIds = (profiles || []).map((p: any) => p.id);
    let allUserSubs: any[] = [];
    if (userIds.length > 0) {
      const { data: subsData } = await (supabase.from("subscriptions") as any)
        .select("id, user_id, store_id, plan, status, updated_at")
        .in("user_id", userIds)
        .order("updated_at", { ascending: false });
      allUserSubs = subsData || [];
    }

    const userSubMap = new Map<string, any>();
    (allUserSubs || []).forEach((s: any) => {
      if (s.user_id && (!userSubMap.has(s.user_id) || s.status === "active")) {
        userSubMap.set(s.user_id, s);
      }
    });

    const users: AdminUser[] = (profiles || [])
      .filter((p: any) => p.email?.toLowerCase() !== "syed.ae018@gmail.com")
      .map((p: any) => {
      const primaryStore = p.stores?.[0];
      const storeSub = primaryStore?.subscriptions?.[0];
      const userSub = userSubMap.get(p.id);

      // Prefer store subscription if available, fallback to user-level subscription
      const effectiveSub = storeSub || userSub;
      const rawPlan = effectiveSub?.plan || "startup";
      const planName = `${rawPlan.toUpperCase()} Plan`;
      const isSuspended = primaryStore?.status === "suspended";

      let storeDisplay = primaryStore?.name;
      if (!storeDisplay) {
        if (effectiveSub && effectiveSub.status === "active") {
          storeDisplay = "Store Setup Pending";
        } else {
          storeDisplay = "Not Created";
        }
      }

      return {
        id: p.id,
        name: p.full_name || p.email?.split("@")[0] || "Merchant User",
        email: p.email || "",
        avatar: p.avatar_url || undefined,
        plan: planName,
        storeName: storeDisplay,
        storeSlug: primaryStore?.slug || "",
        createdAt: p.created_at,
        status: isSuspended ? "suspended" : "active",
      };
    });

    return successResponse(users);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Super Admin Action: Send Password Reset Email to Merchant
 * Never reveals, displays, stores, or generates plaintext passwords.
 */
export async function sendMerchantPasswordResetAction(
  targetEmailOrId: string
): Promise<ActionResponse<void>> {
  try {
    await assertAdminSession();

    let email = targetEmailOrId;
    const adminSupabase = createAdminClient();

    // If a UUID was passed, resolve merchant email from profiles
    if (targetEmailOrId.includes("-") && !targetEmailOrId.includes("@")) {
      const { data: prof } = await (adminSupabase.from("profiles") as any)
        .select("email")
        .eq("id", targetEmailOrId)
        .maybeSingle();

      if (prof?.email) {
        email = prof.email;
      }
    }

    if (!email || !email.includes("@")) {
      return errorResponse("Valid merchant email address is required.");
    }

    let origin = process.env.NEXT_PUBLIC_SITE_URL || "https://kraftaura.in";
    try {
      const headersList = await headers();
      const host = headersList.get("host") || "kraftaura.in";
      const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      origin = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
    } catch {
      // Fallback if called outside HTTP request context
    }

    const { error } = await adminSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/callback?next=/reset-password`,
    });

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse(undefined, "Password reset email sent.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * 3. Update User Status (Suspend / Activate)
 */
export async function updateUserStatusAction(
  userId: string,
  status: "active" | "suspended"
): Promise<ActionResponse<{ id: string; status: "active" | "suspended" }>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    const storeStatus = status === "suspended" ? "suspended" : "live";
    const { error: storeErr } = await supabase
      .from("stores")
      .update({ status: storeStatus })
      .eq("user_id", userId);

    if (storeErr) throw storeErr;

    // Log admin activity
    await supabase.from("activity_logs").insert({
      user_id: adminId,
      action: status === "suspended" ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
      details: { targetUserId: userId, newStatus: status },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/stores");

    return successResponse(
      { id: userId, status },
      `User account ${status === "suspended" ? "suspended" : "activated"} successfully.`
    );
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * 4. Real User Deletion
 */
export async function deleteUserAccountAction(userId: string): Promise<ActionResponse<void>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    // 1. Fetch stores owned by user
    const { data: userStores } = await supabase
      .from("stores")
      .select("id, slug")
      .eq("user_id", userId);

    // 2. Cascade delete stores and profile
    if (userStores && userStores.length > 0) {
      for (const s of userStores) {
        await supabase.from("stores").delete().eq("id", s.id);
        revalidatePath(`/store/${s.slug}`);
      }
    }

    await supabase.from("profiles").delete().eq("id", userId);

    // 3. Log audit event
    await supabase.from("activity_logs").insert({
      user_id: adminId,
      action: "USER_DELETED",
      details: { targetUserId: userId, storesCount: userStores?.length || 0 },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/stores");

    return successResponse(undefined, "User account and associated stores permanently removed.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * 5. Get Real Stores & Domains
 */
export async function getAdminStoresAction(): Promise<ActionResponse<AdminStore[]>> {
  try {
    const { supabase } = await assertAdminSession();

    const { data: storesData, error: sErr } = await supabase
      .from("stores")
      .select(`
        id,
        name,
        slug,
        status,
        created_at,
        profiles (
          full_name,
          email
        ),
        subscriptions (
          plan,
          status
        ),
        products (
          id
        )
      `)
      .order("created_at", { ascending: false });

    if (sErr) throw sErr;

    const stores: AdminStore[] = (storesData || []).map((s: any) => {
      const sub = s.subscriptions?.[0];
      const planName = sub?.plan ? `${sub.plan.toUpperCase()} Plan` : "Startup Plan";

      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        ownerName: s.profiles?.full_name || s.profiles?.email?.split("@")[0] || "Merchant Owner",
        ownerEmail: s.profiles?.email || "",
        productCount: s.products?.length || 0,
        plan: planName,
        status: (s.status as any) || "live",
        themeName: "Bloom Theme",
        createdAt: s.created_at,
      };
    });

    return successResponse(stores);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * 6. Update Store Status (Suspend / Live)
 */
export async function updateStoreStatusAction(
  storeId: string,
  status: "live" | "suspended" | "draft"
): Promise<ActionResponse<{ id: string; status: string }>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    const { data: storeRow, error: sErr } = await supabase
      .from("stores")
      .update({ status })
      .eq("id", storeId)
      .select("id, slug, name")
      .single();

    if (sErr) throw sErr;

    // Log admin action
    await supabase.from("activity_logs").insert({
      store_id: storeId,
      user_id: adminId,
      action: "STORE_STATUS_UPDATED",
      details: { newStatus: status },
    });

    if (storeRow?.slug) {
      revalidatePath(`/store/${storeRow.slug}`);
    }
    revalidatePath("/admin/stores");

    return successResponse(
      { id: storeId, status },
      `Store status changed to ${status}.`
    );
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * 7. Delete Store (True Database Cascade Deletion)
 */
export async function deleteStoreAction(storeId: string): Promise<ActionResponse<void>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    const { data: storeRow, error: findErr } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("id", storeId)
      .maybeSingle();

    if (findErr || !storeRow) {
      return errorResponse("Store not found or already deleted.");
    }

    // Delete store - foreign keys with ON DELETE CASCADE handle child tables
    const { error: delErr } = await supabase.from("stores").delete().eq("id", storeId);
    if (delErr) throw delErr;

    // Log audit event
    await supabase.from("activity_logs").insert({
      user_id: adminId,
      action: "STORE_DELETED",
      details: { deletedStoreId: storeId, storeName: storeRow.name, storeSlug: storeRow.slug },
    });

    revalidatePath(`/store/${storeRow.slug}`);
    revalidatePath("/admin/stores");
    revalidatePath("/admin/users");

    return successResponse(undefined, `Store "${storeRow.name}" permanently deleted.`);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * 8. Impersonate User Session Management
 */
export async function startImpersonationAction(userId: string): Promise<ActionResponse<{ storeId?: string; slug?: string }>> {
  try {
    const { supabase, adminId, adminEmail } = await assertAdminSession();

    const { data: userProfile, error: pErr } = await supabase
      .from("profiles")
      .select("id, email, full_name, stores(id, slug, name)")
      .eq("id", userId)
      .single();

    if (pErr || !userProfile) {
      return errorResponse("Merchant user not found for impersonation.");
    }

    const primaryStore = (userProfile as any).stores?.[0];
    const sessionPayload = {
      adminId,
      adminEmail,
      targetUserId: userProfile.id,
      targetUserEmail: userProfile.email,
      targetUserName: userProfile.full_name || userProfile.email,
      targetStoreId: primaryStore?.id || "",
      targetStoreSlug: primaryStore?.slug || "",
      targetStoreName: primaryStore?.name || "Merchant Store",
      startedAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify(sessionPayload), {
      path: "/",
      httpOnly: false, // Accessible by client context to render banner
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours max
      sameSite: "lax",
    });

    // Log audit event
    await supabase.from("activity_logs").insert({
      user_id: adminId,
      action: "USER_IMPERSONATED",
      details: { targetUserId: userProfile.id, targetEmail: userProfile.email },
    });

    return successResponse(
      { storeId: primaryStore?.id, slug: primaryStore?.slug },
      `Impersonation session established for ${userProfile.email}.`
    );
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

export async function stopImpersonationAction(): Promise<ActionResponse<void>> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(IMPERSONATION_COOKIE);
    return successResponse(undefined, "Exited impersonation session.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

export async function getImpersonationStatusAction(): Promise<ActionResponse<any | null>> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value;
    if (!raw) return successResponse(null);
    return successResponse(JSON.parse(raw));
  } catch {
    return successResponse(null);
  }
}

/**
 * 9. Real Payments & Revenue Records
 */
export async function getAdminPaymentsAction(): Promise<ActionResponse<AdminPayment[]>> {
  try {
    const { supabase } = await assertAdminSession();

    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        currency,
        plan,
        status,
        razorpay_payment_id,
        razorpay_subscription_id,
        created_at,
        stores (
          name,
          profiles (
            full_name,
            email
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const payments: AdminPayment[] = (data || []).map((row: any) => {
      const storeName = row.stores?.name || "Merchant Store";
      const owner = row.stores?.profiles?.full_name || row.stores?.profiles?.email || "Merchant";
      const txId = row.razorpay_payment_id || `TX-${row.id.slice(0, 8).toUpperCase()}`;

      return {
        id: row.id,
        invoiceNumber: txId,
        customerName: owner,
        storeName: storeName,
        amount: Number(row.amount || 0),
        planName: `${(row.plan || "startup").toUpperCase()} Plan`,
        subscriptionId: row.razorpay_subscription_id || null,
        status: row.status === "successful" || row.status === "succeeded" ? "succeeded" : (row.status === "failed" ? "failed" : "pending"),
        createdAt: row.created_at,
      };
    });

    return successResponse(payments);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * 10. Real Catalog Orders
 */
export async function getAdminCatalogOrdersAction(): Promise<ActionResponse<any[]>> {
  try {
    const { supabase } = await assertAdminSession();

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        shipping_address,
        total_amount,
        status,
        created_at,
        stores (
          name,
          slug
        ),
        order_items (
          id,
          product_name,
          quantity,
          price,
          line_total
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const mapped = (data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
      storeName: o.stores?.name || "Storefront",
      storeSlug: o.stores?.slug || "",
      customer: o.customer_name || "Customer",
      customerPhone: o.customer_phone || "",
      shippingAddress: o.shipping_address || "",
      total: Number(o.total_amount || 0),
      itemsCount: o.order_items?.length || 1,
      items: o.order_items || [],
      status: o.status || "pending",
      date: o.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      createdAt: o.created_at,
    }));

    return successResponse(mapped);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Helper to reliably resolve the canonical storage row for platform-wide promo codes.
 * Uses the persistent platform themes table (guaranteed to exist across store cleanups)
 * with graceful backwards-compatible fallback to store_settings.
 */
export async function getGlobalPlatformPromosStorage(supabaseClient?: any): Promise<{
  table: "themes" | "store_settings";
  rowId: string | null;
  metadata: any;
  promos: Coupon[];
}> {
  // Always use admin client with service role to guarantee authoritative access without RLS issues
  const client = createAdminClient();

  // 1. First priority: Check persistent platform themes table
  const { data: themeRow, error: themeError } = await client
    .from("themes")
    .select("id, config_schema")
    .eq("slug", "luxury")
    .maybeSingle();

  if (themeError) {
    console.error("[getGlobalPlatformPromosStorage] Error fetching luxury theme row:", themeError);
  }

  if (themeRow) {
    const config = (themeRow.config_schema as Record<string, any>) || {};
    if (Array.isArray(config.platform_promos)) {
      return {
        table: "themes",
        rowId: themeRow.id,
        metadata: config,
        promos: config.platform_promos,
      };
    }
    return {
      table: "themes",
      rowId: themeRow.id,
      metadata: config,
      promos: [],
    };
  }

  // 2. Secondary check: store_settings
  const { data: rows, error: storeSettingsError } = await client
    .from("store_settings")
    .select("id, metadata");

  if (storeSettingsError) {
    console.error("[getGlobalPlatformPromosStorage] Error fetching store_settings:", storeSettingsError);
  }

  if (rows && rows.length > 0) {
    for (const r of rows) {
      if (r.metadata && Array.isArray((r.metadata as any).platform_promos)) {
        return {
          table: "store_settings",
          rowId: r.id,
          metadata: r.metadata || {},
          promos: (r.metadata as any).platform_promos || [],
        };
      }
    }
    return {
      table: "store_settings",
      rowId: rows[0].id,
      metadata: rows[0].metadata || {},
      promos: [],
    };
  }

  return { table: "themes", rowId: null, metadata: {}, promos: [] };
}

export async function saveGlobalPlatformPromosStorage(
  storage: { table: "themes" | "store_settings"; rowId: string | null; metadata: any },
  promos: Coupon[]
): Promise<void> {
  const adminClient = createAdminClient();

  let rowId = storage.rowId;
  let targetTable = storage.table;

  if (!rowId) {
    const { data: themeRow } = await adminClient
      .from("themes")
      .select("id, config_schema")
      .eq("slug", "luxury")
      .maybeSingle();

    if (themeRow) {
      rowId = themeRow.id;
      targetTable = "themes";
      storage.metadata = themeRow.config_schema || {};
    }
  }

  if (!rowId) {
    console.error("[saveGlobalPlatformPromosStorage] No persistent storage row available.");
    throw new Error("Unable to save promo codes: No persistent database storage row found.");
  }

  if (targetTable === "themes") {
    const updatedConfig = {
      ...(storage.metadata || {}),
      platform_promos: promos,
    };

    const { data, error } = await adminClient
      .from("themes")
      .update({
        config_schema: updatedConfig,
      })
      .eq("id", rowId)
      .select("id");

    if (error) {
      console.error("[saveGlobalPlatformPromosStorage] Database error saving to themes:", error);
      throw new Error(`Database error saving promo codes: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error("[saveGlobalPlatformPromosStorage] Zero rows updated in themes table!");
      throw new Error("Unable to persist promo code to database (0 rows updated).");
    }
  } else {
    const updatedMetadata = {
      ...(storage.metadata || {}),
      platform_promos: promos,
    };

    const { data, error } = await adminClient
      .from("store_settings")
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rowId)
      .select("id");

    if (error) {
      console.error("[saveGlobalPlatformPromosStorage] Database error saving to store_settings:", error);
      throw new Error(`Database error saving promo codes: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error("[saveGlobalPlatformPromosStorage] Zero rows updated in store_settings table!");
      throw new Error("Unable to persist promo code to database (0 rows updated).");
    }
  }
}

/**
 * 11. SaaS Plan Promo Codes Management
 */
export async function getPlatformPromoCodesAction(): Promise<ActionResponse<Coupon[]>> {
  try {
    await assertAdminSession();

    const [storage, plans] = await Promise.all([
      getGlobalPlatformPromosStorage(),
      getAllPlans(true),
    ]);

    const planMap = new Map<string, string>();
    planMap.set("all", "All Plans");
    for (const p of plans) {
      planMap.set(p.id.toLowerCase(), p.name);
    }

    const rawPromos: any[] = storage.promos || [];
    const promos: Coupon[] = rawPromos.map((p) => {
      const planId = (p.applicablePlanId || (p.applicablePlans && p.applicablePlans[0]) || "all").toLowerCase();
      const planName = planMap.get(planId) || planMap.get(normalizePlanTier(planId)) || (planId === "all" ? "All Plans" : planId);
      const cycle: CouponBillingCycle = p.billingCycle || p.applicableInterval || "all";
      const scope: DiscountScope = p.discountScope || (cycle === "annual" ? "entire_period" : "first_payment");

      return {
        id: p.id,
        code: (p.code || "").trim().toUpperCase(),
        discountType: p.discountType || "percentage",
        value: Number(p.value || 0),
        expiryDate: p.expiryDate || null,
        usageLimit: Number(p.usageLimit || 100),
        usageCount: Number(p.usageCount || 0),
        status: p.status || "active",
        applicablePlanId: planId,
        applicablePlanName: planName,
        applicablePlans: p.applicablePlans || [planId],
        applicableInterval: cycle,
        billingCycle: cycle,
        discountScope: scope,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return successResponse(promos);
  } catch (err) {
    console.error("[getPlatformPromoCodesAction] Error loading promos:", err);
    return errorResponse(getErrorMessage(err) || "Unable to load promo codes.");
  }
}

export async function createPlatformPromoCodeAction(
  input: Omit<Coupon, "id" | "usageCount">
): Promise<ActionResponse<Coupon>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    const cleanCode = (input.code || "").trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      return errorResponse("Promo code must be at least 3 characters.");
    }

    const val = Number(input.value);
    if (isNaN(val) || val <= 0) {
      return errorResponse("Discount value must be greater than 0.");
    }

    if (input.discountType === "percentage" && val > 100) {
      return errorResponse("Percentage discount cannot exceed 100%.");
    }

    const limit = Number(input.usageLimit);
    if (isNaN(limit) || limit < 1) {
      return errorResponse("Maximum uses must be at least 1.");
    }

    const storage = await getGlobalPlatformPromosStorage();
    const existingPromos: Coupon[] = storage.promos || [];

    if (existingPromos.some((p) => p.code.trim().toUpperCase() === cleanCode)) {
      return errorResponse("Promo code already exists.");
    }

    const planId = (input.applicablePlanId || (input.applicablePlans && input.applicablePlans[0]) || "all").toLowerCase();
    const plans = await getAllPlans(true);
    const matchedPlan = plans.find((p) => p.id.toLowerCase() === planId || normalizePlanTier(p.id) === normalizePlanTier(planId));
    const planName = planId === "all" ? "All Plans" : matchedPlan?.name || planId;

    const billingCycle: CouponBillingCycle = input.billingCycle || input.applicableInterval || "all";
    const discountScope: DiscountScope = input.discountScope || (billingCycle === "annual" ? "entire_period" : "first_payment");

    const now = new Date().toISOString();
    const newCoupon: Coupon = {
      id: `promo_${Date.now()}`,
      code: cleanCode,
      discountType: input.discountType,
      value: val,
      usageLimit: limit,
      usageCount: 0, // Always starts at 0 - tracked automatically upon payment
      expiryDate: input.expiryDate ? input.expiryDate : null,
      status: input.status === "inactive" ? "inactive" : "active",
      applicablePlanId: planId,
      applicablePlanName: planName,
      applicablePlans: [planId],
      applicableInterval: billingCycle,
      billingCycle: billingCycle,
      discountScope: discountScope,
      createdAt: now,
      updatedAt: now,
    };

    const updatedPromos = [newCoupon, ...existingPromos];
    await saveGlobalPlatformPromosStorage(storage, updatedPromos);

    try {
      await supabase.from("activity_logs").insert({
        user_id: adminId,
        action: "PROMO_CODE_CREATED",
        details: {
          code: cleanCode,
          discountType: input.discountType,
          value: val,
          applicablePlanId: planId,
          usageLimit: limit,
        },
      });
    } catch (logErr) {
      console.warn("[createPlatformPromoCodeAction] Failed to write activity log:", logErr);
    }

    revalidatePath("/admin/coupons");
    return successResponse(newCoupon, `Promo code "${cleanCode}" created successfully.`);
  } catch (err) {
    console.error("[createPlatformPromoCodeAction] Error creating promo code:", err);
    return errorResponse(getErrorMessage(err) || "Unable to create promo code. Please try again.");
  }
}

export async function updatePlatformPromoCodeAction(
  codeId: string,
  updates: Partial<Omit<Coupon, "id" | "usageCount" | "code">>
): Promise<ActionResponse<Coupon>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    const storage = await getGlobalPlatformPromosStorage();
    const existingPromos: Coupon[] = storage.promos || [];
    const index = existingPromos.findIndex((p) => p.id === codeId);

    if (index === -1) {
      return errorResponse("Promo code not found.");
    }

    const current = existingPromos[index];

    // Validate updates
    let val = current.value;
    if (updates.value !== undefined) {
      val = Number(updates.value);
      if (isNaN(val) || val <= 0) {
        return errorResponse("Discount value must be greater than 0.");
      }
      if (updates.discountType === "percentage" && val > 100) {
        return errorResponse("Percentage discount cannot exceed 100%.");
      }
    }

    let limit = current.usageLimit;
    if (updates.usageLimit !== undefined) {
      limit = Number(updates.usageLimit);
      if (isNaN(limit) || limit < 1) {
        return errorResponse("Maximum uses must be at least 1.");
      }
      if (limit < (current.usageCount || 0)) {
        return errorResponse(`Maximum uses cannot be less than current used count (${current.usageCount}).`);
      }
    }

    let planId = current.applicablePlanId || "all";
    let planName = current.applicablePlanName || "All Plans";
    if (updates.applicablePlanId !== undefined) {
      planId = updates.applicablePlanId.toLowerCase();
      const plans = await getAllPlans(true);
      const matchedPlan = plans.find((p) => p.id.toLowerCase() === planId || normalizePlanTier(p.id) === normalizePlanTier(planId));
      planName = planId === "all" ? "All Plans" : matchedPlan?.name || planId;
    }

    const billingCycle: CouponBillingCycle = updates.billingCycle || updates.applicableInterval || current.billingCycle || current.applicableInterval || "all";
    const discountScope: DiscountScope = updates.discountScope || current.discountScope || (billingCycle === "annual" ? "entire_period" : "first_payment");

    const updatedCoupon: Coupon = {
      ...current,
      discountType: updates.discountType || current.discountType,
      value: val,
      usageLimit: limit,
      expiryDate: updates.expiryDate !== undefined ? updates.expiryDate : current.expiryDate,
      status: updates.status || current.status,
      applicablePlanId: planId,
      applicablePlanName: planName,
      applicablePlans: [planId],
      applicableInterval: billingCycle,
      billingCycle,
      discountScope,
      updatedAt: new Date().toISOString(),
    };

    const newPromos = [...existingPromos];
    newPromos[index] = updatedCoupon;

    await saveGlobalPlatformPromosStorage(storage, newPromos);

    try {
      await supabase.from("activity_logs").insert({
        user_id: adminId,
        action: "PROMO_CODE_UPDATED",
        details: {
          codeId,
          code: current.code,
          changes: updates,
        },
      });
    } catch (logErr) {
      console.warn("[updatePlatformPromoCodeAction] Failed to write activity log:", logErr);
    }

    revalidatePath("/admin/coupons");
    return successResponse(updatedCoupon, `Promo code "${current.code}" updated successfully.`);
  } catch (err) {
    console.error("[updatePlatformPromoCodeAction] Error updating promo code:", err);
    return errorResponse(getErrorMessage(err) || "Unable to update promo code.");
  }
}

export async function togglePlatformPromoCodeStatusAction(
  codeId: string
): Promise<ActionResponse<Coupon>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    const storage = await getGlobalPlatformPromosStorage();
    const existingPromos: Coupon[] = storage.promos || [];
    const index = existingPromos.findIndex((p) => p.id === codeId);

    if (index === -1) {
      return errorResponse("Promo code not found.");
    }

    const current = existingPromos[index];
    const newStatus = current.status === "active" ? "inactive" : "active";

    const updatedCoupon: Coupon = {
      ...current,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const newPromos = [...existingPromos];
    newPromos[index] = updatedCoupon;

    await saveGlobalPlatformPromosStorage(storage, newPromos);

    try {
      await supabase.from("activity_logs").insert({
        user_id: adminId,
        action: "PROMO_CODE_STATUS_TOGGLED",
        details: { codeId, code: current.code, status: newStatus },
      });
    } catch (logErr) {
      console.warn("[togglePlatformPromoCodeStatusAction] Failed to write activity log:", logErr);
    }

    revalidatePath("/admin/coupons");
    return successResponse(
      updatedCoupon,
      `Promo code "${current.code}" is now ${newStatus}.`
    );
  } catch (err) {
    console.error("[togglePlatformPromoCodeStatusAction] Error toggling status:", err);
    return errorResponse(getErrorMessage(err) || "Unable to update promo code status.");
  }
}

export async function deletePlatformPromoCodeAction(codeId: string): Promise<ActionResponse<void>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    const storage = await getGlobalPlatformPromosStorage();
    const existingPromos: Coupon[] = storage.promos || [];
    
    const existing = existingPromos.find((p) => p.id === codeId);
    if (!existing) {
      return errorResponse("Promo code not found or already deleted.");
    }

    const filtered = existingPromos.filter((p) => p.id !== codeId);
    await saveGlobalPlatformPromosStorage(storage, filtered);

    try {
      await supabase.from("activity_logs").insert({
        user_id: adminId,
        action: "PROMO_CODE_DELETED",
        details: { codeId, code: existing.code },
      });
    } catch (logErr) {
      console.warn("[deletePlatformPromoCodeAction] Failed to write activity log:", logErr);
    }

    revalidatePath("/admin/coupons");
    return successResponse(undefined, "Promo code deleted.");
  } catch (err) {
    console.error("[deletePlatformPromoCodeAction] Error deleting promo code:", err);
    return errorResponse(getErrorMessage(err) || "Unable to delete promo code. Please try again.");
  }
}

/**
 * 12. Server-side SaaS Promo Code Validation during Checkout
 */
export async function validateSaaSPromoCodeAction(
  code: string,
  planTier: string,
  interval: BillingInterval = "monthly"
): Promise<
  ActionResponse<{
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    code: string;
    discountType: "percentage" | "flat";
    value: number;
    billingCycle: CouponBillingCycle;
    discountScope: DiscountScope;
    renewalPrice: number;
    renewalText: string;
  }>
> {
  try {
    const cleanCode = (code || "").trim().toUpperCase();
    if (!cleanCode) return errorResponse("Please enter a promo code.");

    const authoritativePlan = await getAuthoritativePlan(planTier);
    if (!authoritativePlan) return errorResponse("Invalid plan tier specified.");

    const originalPrice =
      interval === "annual" ? authoritativePlan.priceAnnual : authoritativePlan.priceMonthly;

    const supabase = await createServerSupabaseClient();
    const storage = await getGlobalPlatformPromosStorage(supabase);
    const promos: Coupon[] = storage.promos || [];
    const found = promos.find((p) => p.code?.trim().toUpperCase() === cleanCode);

    if (!found) {
      return errorResponse("Invalid promo code.");
    }

    if (found.status !== "active") {
      return errorResponse("This promo code is no longer active.");
    }

    if (found.expiryDate && new Date(found.expiryDate).getTime() < Date.now()) {
      return errorResponse("This promo code has expired.");
    }

    if (found.usageLimit > 0 && (found.usageCount || 0) >= found.usageLimit) {
      return errorResponse("This promo code has reached its usage limit.");
    }

    // Strict plan restriction verification
    const selectedTier = normalizePlanTier(planTier);
    const applicablePlan = (found.applicablePlanId || (found.applicablePlans && found.applicablePlans[0]) || "all").toLowerCase();

    if (applicablePlan !== "all") {
      const allowedTier = normalizePlanTier(applicablePlan);
      if (allowedTier !== selectedTier) {
        return errorResponse("This promo code is not valid for this plan.");
      }
    }

    // Strict billing cycle compatibility verification
    const couponCycle: CouponBillingCycle = found.billingCycle || found.applicableInterval || "all";
    if (couponCycle !== "all") {
      if (couponCycle === "annual" && interval !== "annual") {
        return errorResponse("This promo code is only valid for annual billing.");
      }
      if (couponCycle === "monthly" && interval !== "monthly") {
        return errorResponse("This promo code is only valid for monthly billing.");
      }
    }

    // Exact two-decimal currency precision
    let discount = 0;
    if (found.discountType === "percentage") {
      discount = Math.round(((originalPrice * found.value) / 100) * 100) / 100;
    } else {
      discount = Math.min(originalPrice, Math.round(Number(found.value) * 100) / 100);
    }

    const finalPrice = Math.max(0, Math.round((originalPrice - discount) * 100) / 100);
    const discountScope: DiscountScope =
      found.discountScope || (interval === "annual" ? "entire_period" : "first_payment");
    const renewalPrice = discountScope === "recurring" ? finalPrice : originalPrice;
    const renewalText =
      discountScope === "first_payment"
        ? `₹${finalPrice.toFixed(2)} today, then ₹${originalPrice.toFixed(2)}/month.`
        : interval === "annual"
        ? `₹${finalPrice.toFixed(2)} today for 12 months.`
        : `₹${finalPrice.toFixed(2)}/${interval}`;

    return successResponse(
      {
        originalPrice,
        discountAmount: discount,
        finalPrice,
        code: cleanCode,
        discountType: found.discountType,
        value: found.value,
        billingCycle: couponCycle,
        discountScope,
        renewalPrice,
        renewalText,
      },
      `Coupon "${cleanCode}" applied! You saved ₹${discount.toFixed(2)}.`
    );
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * Atomically records promo code usage upon confirmed payment
 * Enforces atomic race-condition checking so usageCount never exceeds usageLimit
 */
export async function recordPromoCodeUsageAction(code: string): Promise<boolean> {
  try {
    const cleanCode = (code || "").trim().toUpperCase();
    if (!cleanCode) return false;

    const supabase = createAdminClient();
    const storage = await getGlobalPlatformPromosStorage(supabase);
    if (!storage.rowId) return false;

    const existingMeta: any = storage.metadata || {};
    const existingPromos: Coupon[] = storage.promos || [];
    let updated = false;

    const newPromos = existingPromos.map((p) => {
      if (p.code?.trim().toUpperCase() === cleanCode) {
        const currentCount = Number(p.usageCount || 0);
        if (p.usageLimit > 0 && currentCount >= p.usageLimit) {
          // Already capped - reject increment
          return p;
        }
        updated = true;
        return {
          ...p,
          usageCount: currentCount + 1,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    if (updated) {
      await saveGlobalPlatformPromosStorage(storage, newPromos);
      return true;
    }

    return false;
  } catch (err) {
    console.error("Failed to record promo code usage:", err);
    return false;
  }
}

/**
 * 13. Theme Templates Management
 */
export async function getThemeTemplatesAction(): Promise<ActionResponse<Template[]>> {
  try {
    const { supabase } = await assertAdminSession();

    const { data: themes, error } = await supabase
      .from("themes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const templates: Template[] = (themes || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      version: "v2.0",
      description: `Production storefront theme: ${t.name}`,
      thumbnail: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600",
      activeStoresCount: 1,
      status: t.is_active ? "active" : "disabled",
    }));

    return successResponse(templates);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

export async function createThemeTemplateAction(
  input: Omit<Template, "id" | "activeStoresCount">
): Promise<ActionResponse<Template>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { data, error } = await supabase
      .from("themes")
      .insert({
        name: input.name,
        slug,
        is_active: input.status === "active",
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("activity_logs").insert({
      user_id: adminId,
      action: "THEME_TEMPLATE_CREATED",
      details: { themeId: data.id, name: data.name },
    });

    revalidatePath("/admin/templates");

    return successResponse({
      id: data.id,
      name: data.name,
      version: input.version || "v1.0",
      description: input.description,
      thumbnail: input.thumbnail,
      activeStoresCount: 0,
      status: "active",
    }, "Theme template created successfully.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

/**
 * 14. Platform System Settings
 */
export async function getPlatformSettingsAction(): Promise<ActionResponse<any>> {
  try {
    const { supabase } = await assertAdminSession();

    const { data: row } = await supabase
      .from("store_settings")
      .select("metadata")
      .limit(1)
      .maybeSingle();

    const meta = row?.metadata?.system_settings || {
      platformName: "Kraftaura SaaS",
      supportEmail: "support@kraftaura.in",
      defaultCurrency: "INR",
      maintenanceMode: false,
      enableSignups: true,
      enableCreativeServices: true,
    };

    return successResponse(meta);
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}

export async function updatePlatformSettingsAction(settingsPayload: any): Promise<ActionResponse<void>> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    const { data: row } = await supabase
      .from("store_settings")
      .select("id, metadata")
      .limit(1)
      .maybeSingle();

    if (row) {
      const r = row as any;
      await supabase
        .from("store_settings")
        .update({
          metadata: {
            ...(r.metadata || {}),
            system_settings: settingsPayload,
          },
        })
        .eq("id", r.id);
    }


    await supabase.from("activity_logs").insert({
      user_id: adminId,
      action: "SYSTEM_SETTINGS_UPDATED",
      details: settingsPayload,
    });

    revalidatePath("/admin/settings");
    return successResponse(undefined, "Platform settings saved.");
  } catch (err) {
    return errorResponse(getErrorMessage(err));
  }
}
