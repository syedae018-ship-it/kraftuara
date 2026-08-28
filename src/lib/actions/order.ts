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
    await verifyOrderStoreOwner(supabase, orderId);

    const { data: orderRow, error } = await (supabase.from("orders") as any)
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    
    if (error || !orderRow) throw new Error("Order not found");
    
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
        status: orderRow.status,
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

    // Verify Pro plan entitlement
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

    if (!hasFeatureAccess(plan, "order_management") && !hasFeatureAccess(plan, "orders")) {
      return { success: false, error: "Order lifecycle and status management is exclusive to the Pro Plan." };
    }

    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    const normalizedStatus = status.toLowerCase().trim();
    if (!validStatuses.includes(normalizedStatus)) {
      return { success: false, error: "Invalid order status specified." };
    }

    const { error } = await (supabase.from("orders") as any)
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "We couldn't update this order. Please try again." };
  }
}

/**
 * Public secure order tracking action for storefront customers (Pro stores only)
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

    // 2. Check store Pro entitlement
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
      if (subStatus === "expired" || subStatus === "cancelled") {
        plan = "startup";
      }

      if (!hasFeatureAccess(plan, "customer_order_tracking") && !hasFeatureAccess(plan, "orders")) {
        return {
          success: false,
          error: "Order tracking is an exclusive Pro Plan feature. The merchant has not enabled live tracking.",
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
      return { success: false, error: "We couldn't find an order with that ID." };
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
        status: orderRow.status || "pending",
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
    return { success: false, error: "Unable to retrieve tracking information at this time." };
  }
}
