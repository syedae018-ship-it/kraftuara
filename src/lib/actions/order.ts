"use server";

import { orderRepository, CustomerInput, OrderItemInput } from "@/lib/repositories/order-repository";
import { createServerInstance } from "@/lib/supabase/server";

async function verifyOrderStoreOwner(supabase: any, orderId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: orderRow } = await supabase
    .from("orders")
    .select("store_id")
    .eq("id", orderId)
    .maybeSingle();
    
  if (!orderRow) throw new Error("Order not found");

  const { data: storeRow } = await supabase
    .from("stores")
    .select("id")
    .eq("id", orderRow.store_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!storeRow) throw new Error("Access Denied: You do not own this store.");
  return { storeId: orderRow.store_id, userId: user.id };
}

export async function createOrderAction(
  storeId: string,
  customer: CustomerInput,
  items: OrderItemInput[]
) {
  try {
    const order = await orderRepository.createOrder(storeId, customer, items);
    return { success: true, order };
  } catch (err: any) {
    console.error("Order creation action error:", err);
    let userMessage = "Failed to place order. Please try again.";
    const errMsg = err.message || "";
    
    if (errMsg.includes("row-level security policy")) {
      userMessage = "Order creation failed due to database security constraints. Please contact support.";
    } else if (errMsg.includes("no longer available") || errMsg.includes("does not belong") || errMsg.includes("currently unavailable")) {
      userMessage = errMsg;
    } else if (errMsg.includes("quantity")) {
      userMessage = errMsg;
    } else if (errMsg.includes("violates foreign key constraint") || errMsg.includes("violates unique constraint")) {
      userMessage = "Failed to record order. The product catalog has changed. Please refresh your cart.";
    }
    
    return { success: false, error: userMessage };
  }
}

export async function getOrderDetailsAction(orderId: string) {
  try {
    const supabase = await createServerInstance();
    const { storeId } = await verifyOrderStoreOwner(supabase, orderId);

    const { data: orderRow, error } = await (supabase.from("orders") as any)
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    
    if (error || !orderRow) throw new Error("Order not found");

    let resolvedStatus = orderRow.status || "pending";
    try {
      const { data: latestLog } = await (supabase.from("activity_logs") as any)
        .select("details")
        .eq("store_id", storeId)
        .eq("action", "order_status_updated")
        .order("created_at", { ascending: false })
        .limit(20);

      if (latestLog && latestLog.length > 0) {
        const match = latestLog.find((l: any) => l.details?.order_id === orderId);
        if (match?.details?.status) {
          resolvedStatus = match.details.status.toLowerCase().trim();
        }
      }
    } catch {
      // Non-blocking fallback
    }
    
    return {
      success: true,
      order: {
        id: orderRow.id,
        storeId: orderRow.store_id,
        orderNumber: orderRow.order_number,
        customerName: orderRow.customer_name,
        customerPhone: orderRow.customer_phone,
        shippingAddress: orderRow.shipping_address,
        totalAmount: Number(orderRow.total_amount),
        status: resolvedStatus,
        createdAt: orderRow.created_at,
        updatedAt: orderRow.updated_at,
        items: orderRow.order_items ? orderRow.order_items.map((itm: any) => ({
          id: itm.id,
          orderId: itm.order_id,
          productId: itm.product_id,
          productName: itm.product_name,
          price: Number(itm.price),
          quantity: itm.quantity,
          lineTotal: Number(itm.line_total)
        })) : []
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load order" };
  }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  try {
    const supabase = await createServerInstance();
    const { storeId } = await verifyOrderStoreOwner(supabase, orderId);

    // Verify Growth or Pro plan entitlement using centralized feature gating
    const { data: subRow } = await (supabase.from("subscriptions") as any)
      .select("plan, status, current_period_end")
      .eq("store_id", storeId)
      .maybeSingle();

    const { normalizePlanTier, hasFeatureAccess, getPlanDisplayName } = await import("@/lib/feature-gating");
    let plan = "startup";
    let subStatus = subRow?.status || "active";
    if (subRow) {
      plan = normalizePlanTier(subRow.plan);
      if (subRow.current_period_end && new Date(subRow.current_period_end).getTime() < Date.now()) {
        subStatus = "expired";
      }
    }
    if (subStatus === "expired" || subStatus === "cancelled" || subStatus === "pending") {
      plan = "startup";
    }

    if (!hasFeatureAccess(plan, "order_management")) {
      return { success: false, error: `Order status management requires the ${getPlanDisplayName("growth")} or ${getPlanDisplayName("pro")}.` };
    }

    const { CANONICAL_ORDER_STATUSES } = await import("@/types/order");
    const normalizedStatus = status.toLowerCase().trim();
    if (!CANONICAL_ORDER_STATUSES.includes(normalizedStatus as any)) {
      return { success: false, error: "Invalid order status specified." };
    }

    // 1. Try updating direct database column
    const { error: updateErr } = await (supabase.from("orders") as any)
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);
      
    if (updateErr) {
      // If DB constraint rejects the value (e.g. processing), update the timestamp
      await (supabase.from("orders") as any)
        .update({ updated_at: new Date().toISOString() })
        .eq("id", orderId);
    }

    // 2. Authoritatively log status transition in activity_logs
    await (supabase.from("activity_logs") as any).insert({
      store_id: storeId,
      action: "order_status_updated",
      details: { order_id: orderId, status: normalizedStatus },
    });
    
    return { success: true, status: normalizedStatus };
  } catch (err: any) {
    return { success: false, error: "We couldn't update the order status. Please try again." };
  }
}

/**
 * Public secure order tracking action for storefront customers (Growth & Pro stores)
 */
export async function trackOrderAction(storeSlug: string, orderNumber: string) {
  try {
    if (!storeSlug?.trim() || !orderNumber?.trim()) {
      return { success: false, error: "Please enter a valid Order ID." };
    }

    let supabase: any;
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      supabase = createAdminClient();
    } catch {
      supabase = await createServerInstance();
    }

    // 1. Resolve store
    const isDemo = ["demo", "demo-craft-classic", "craft-classic", "aroma-perfumes"].includes(storeSlug.toLowerCase());
    
    const { data: storeRow, error: storeErr } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("slug", storeSlug.trim().toLowerCase())
      .maybeSingle();

    if ((storeErr || !storeRow) && !isDemo) {
      return { success: false, error: "Store not found." };
    }

    const storeId = storeRow?.id || "demo-craft-classic-id";

    // 2. Check store Growth or Pro entitlement for order tracking using centralized feature gating
    if (!isDemo) {
      const { data: subRow } = await (supabase.from("subscriptions") as any)
        .select("plan, status, current_period_end")
        .eq("store_id", storeId)
        .maybeSingle();

      const { normalizePlanTier, hasFeatureAccess } = await import("@/lib/feature-gating");
      let plan = "startup";
      let subStatus = subRow?.status || "active";
      if (subRow) {
        plan = normalizePlanTier(subRow.plan);
        if (subRow.current_period_end && new Date(subRow.current_period_end).getTime() < Date.now()) {
          subStatus = "expired";
        }
      }
      if (subStatus === "expired" || subStatus === "cancelled" || subStatus === "pending") {
        plan = "startup";
      }

      if (!hasFeatureAccess(plan, "customer_order_tracking")) {
        return {
          success: false,
          error: "Order tracking is not available on this plan.",
        };
      }
    }

    // 3. Query order by storeId and orderNumber
    const normalizedOrderNum = orderNumber.trim().toUpperCase();

    // Handle demo store order tracking
    if (isDemo && normalizedOrderNum.startsWith("KRA-")) {
      return {
        success: true,
        order: {
          orderNumber: normalizedOrderNum,
          status: "processing",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customerNameMasked: "P*** S***",
          totalAmount: 1499,
          itemCount: 1,
          items: [{ productName: "Demo Artisan Craft", quantity: 1, price: 1499 }],
        },
      };
    }

    const { data: orderRow, error: orderErr } = await (supabase.from("orders") as any)
      .select("id, order_number, customer_name, total_amount, status, created_at, updated_at, order_items(*)")
      .eq("store_id", storeId)
      .eq("order_number", normalizedOrderNum)
      .maybeSingle();

    if (orderErr || !orderRow) {
      return { success: false, error: "We couldn't find this order." };
    }

    // Resolve authoritative status from activity_logs if present
    let resolvedStatus = orderRow.status || "pending";
    try {
      const { data: latestLog } = await (supabase.from("activity_logs") as any)
        .select("details")
        .eq("store_id", storeId)
        .eq("action", "order_status_updated")
        .order("created_at", { ascending: false })
        .limit(20);

      if (latestLog && latestLog.length > 0) {
        const match = latestLog.find((l: any) => l.details?.order_id === orderRow.id);
        if (match?.details?.status) {
          resolvedStatus = match.details.status.toLowerCase().trim();
        }
      }
    } catch {
      // Non-blocking fallback
    }

    // Mask customer name safely for PII protection (e.g. "Riya Sharma" -> "R*** S***")
    const rawName = orderRow.customer_name || "Customer";
    const nameParts = rawName.trim().split(/\s+/);
    const maskedParts = nameParts.map((part: string) =>
      part.length > 1 ? `${part[0]}***` : part
    );
    const customerNameMasked = maskedParts.join(" ");

    return {
      success: true,
      order: {
        orderNumber: orderRow.order_number,
        status: resolvedStatus,
        createdAt: orderRow.created_at,
        updatedAt: orderRow.updated_at,
        customerNameMasked,
        totalAmount: Number(orderRow.total_amount),
        itemCount: orderRow.order_items?.length || 0,
        items: orderRow.order_items
          ? orderRow.order_items.map((itm: any) => ({
              productName: itm.product_name,
              quantity: itm.quantity,
              price: Number(itm.price),
            }))
          : [],
      },
    };
  } catch (err: any) {
    return { success: false, error: "We couldn't find this order." };
  }
}

