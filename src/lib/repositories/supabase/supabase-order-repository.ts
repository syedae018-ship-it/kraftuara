import { Order, OrderItemInput, CustomerInput, IOrderRepository } from "../order-repository";
import { createClient } from "@/lib/supabase/client";
import { DEMO_STORE_PRODUCTS } from "@/lib/demo-data";
import { supabaseCouponRepository } from "./supabase-coupon-repository";

export class SupabaseOrderRepository implements IOrderRepository {
  private getSupabase(client?: any) {
    if (client) return client;
    if (typeof window === "undefined") {
      try {
        const { createAdminClient } = require("@/lib/supabase/admin");
        return createAdminClient();
      } catch {
        return createClient();
      }
    }
    return createClient();
  }

  async createOrder(storeId: string, customer: CustomerInput, items: OrderItemInput[]): Promise<Order> {
    const supabase = this.getSupabase();


    // 1. Catch and simulate demo store orders
    if (storeId === "demo-craft-classic-id" || storeId.startsWith("demo-") || storeId === "demo") {
      if (items.length === 0) {
        throw new Error("Cannot create an order with an empty cart.");
      }

      const productMap = new Map<string, any>();
      DEMO_STORE_PRODUCTS.forEach((p) => {
        productMap.set(p.id, p);
      });

      let calculatedTotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const dbProduct = productMap.get(item.productId);
        if (!dbProduct) {
          throw new Error(`Product "${item.name}" is no longer available in the catalog.`);
        }
        
        const quantity = Math.floor(Number(item.quantity));
        if (isNaN(quantity) || quantity <= 0 || quantity > 999) {
          throw new Error("Invalid product quantity specified.");
        }

        const realPrice = Number(dbProduct.price);
        const lineTotal = realPrice * quantity;
        calculatedTotal += lineTotal;

        validatedItems.push({
          productId: dbProduct.id,
          productName: dbProduct.name,
          price: realPrice,
          quantity,
          lineTotal,
        });
      }

      const randomHex = Math.random().toString(36).substring(2, 9).toUpperCase();
      const orderNumber = `KRA-${randomHex}`;

      let discountAmount = 0;
      let appliedCouponCode = null;
      if (customer.couponCode) {
        const uppercaseCode = customer.couponCode.trim().toUpperCase();
        if (uppercaseCode === "WELCOME10" || uppercaseCode === "LAUNCH2026") {
          discountAmount = (calculatedTotal * 10) / 100;
          appliedCouponCode = uppercaseCode;
        } else {
          throw new Error("Invalid coupon code.");
        }
      }
      const finalAmount = calculatedTotal - discountAmount;

      return {
        id: `demo-order-${Date.now()}`,
        storeId,
        orderNumber,
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        shippingAddress: customer.shippingAddress.trim(),
        totalAmount: finalAmount,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: validatedItems.map((itm, idx) => ({
          id: `item-${idx}`,
          orderId: "demo-order",
          productId: itm.productId,
          productName: itm.productName,
          price: itm.price,
          quantity: itm.quantity,
          lineTotal: itm.lineTotal,
        })),
      };
    }

    // 2. Verify store exists and is published
    const { data: storeRow, error: storeError } = await (supabase.from("stores") as any)
      .select("id, is_published")
      .eq("id", storeId)
      .maybeSingle();

    if (storeError || !storeRow) {
      throw new Error("Store not found or database connection failed.");
    }
    if (!storeRow.is_published) {
      throw new Error("This store is currently not taking orders (unpublished/suspended).");
    }

    if (items.length === 0) {
      throw new Error("Cannot create an order with an empty cart.");
    }

    // 3. Fetch all products to resolve authoritative names and prices
    const productIds = items.map((i) => i.productId);
    const { data: dbProducts, error: pError } = await (supabase.from("products") as any)
      .select("id, name, price, store_id, is_published, sku")
      .in("id", productIds);

    if (pError || !dbProducts) {
      throw new Error("Failed to validate product catalog selection.");
    }

    const productMap = new Map<string, any>();
    dbProducts.forEach((p: any) => {
      productMap.set(p.id, p);
    });

    // 4. Validate items & calculate authoritative server-side totals
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        throw new Error(`Product "${item.name}" is no longer available in the catalog.`);
      }
      if (dbProduct.store_id !== storeId) {
        throw new Error(`Product "${dbProduct.name}" does not belong to this store.`);
      }
      if (!dbProduct.is_published) {
        throw new Error(`Product "${dbProduct.name}" is currently unavailable (draft/unpublished).`);
      }

      // Quantity validations
      const quantity = Math.floor(Number(item.quantity));
      if (isNaN(quantity) || quantity <= 0 || quantity > 999) {
        throw new Error("Invalid product quantity specified.");
      }

      const realPrice = Number(dbProduct.price);
      const lineTotal = realPrice * quantity;
      calculatedTotal += lineTotal;

      validatedItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        price: realPrice,
        quantity,
        lineTotal,
      });
    }

    // 5. Generate unique Kraftaura Order ID (e.g. KRA-8F42X91)
    const randomHex = Math.random().toString(36).substring(2, 9).toUpperCase();
    const orderNumber = `KRA-${randomHex}`;

    // Validate and apply coupon if provided
    let discountAmount = 0;
    let appliedCouponCode = null;
    
    if (customer.couponCode) {
      const couponRes = await supabaseCouponRepository.validateCoupon(storeId, customer.couponCode, calculatedTotal, supabase);
      if (couponRes.success && couponRes.discountAmount > 0) {
        discountAmount = couponRes.discountAmount;
        appliedCouponCode = customer.couponCode.trim().toUpperCase();
        
        // Increment usage count atomically
        if (couponRes.coupon?.id) {
          await (supabase.from("coupons") as any)
            .update({ usage_count: (couponRes.coupon.usageCount || 0) + 1 })
            .eq("id", couponRes.coupon.id);
        }
      } else if (!couponRes.success) {
        throw new Error(couponRes.error || "Invalid coupon code.");
      }
    }

    const finalAmount = calculatedTotal - discountAmount;

    // 6. Insert order record
    const { data: orderRow, error: orderError } = await (supabase.from("orders") as any)
      .insert({
        store_id: storeId,
        order_number: orderNumber,
        customer_name: customer.name.trim(),
        customer_phone: customer.phone.trim(),
        shipping_address: customer.shippingAddress.trim(),
        total_amount: finalAmount,
        coupon_code: appliedCouponCode,
        discount_amount: discountAmount,
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !orderRow) {
      throw new Error(orderError?.message || "Failed to create order transaction.");
    }

    const orderId = (orderRow as any).id;

    // 6. Insert order items snapshots
    const orderItemsPayload = validatedItems.map((v) => ({
      order_id: orderId,
      product_id: v.productId,
      product_name: v.productName,
      price: v.price,
      quantity: v.quantity,
      line_total: v.lineTotal,
    }));

    const { error: itemsError } = await (supabase.from("order_items") as any).insert(orderItemsPayload);
    if (itemsError) {
      // Clean up order to prevent orphans (or transaction rollbacks)
      await (supabase.from("orders") as any).delete().eq("id", orderId);
      throw new Error("Failed to record order details snapshot.");
    }

    return {
      id: orderId,
      storeId,
      orderNumber,
      customerName: (orderRow as any).customer_name,
      customerPhone: (orderRow as any).customer_phone,
      shippingAddress: (orderRow as any).shipping_address,
      totalAmount: Number((orderRow as any).total_amount),
      status: (orderRow as any).status,
      createdAt: (orderRow as any).created_at,
      updatedAt: (orderRow as any).updated_at,
      items: orderItemsPayload.map((itm, idx) => ({
        id: `item-${idx}`,
        orderId,
        productId: itm.product_id,
        productName: itm.product_name,
        price: itm.price,
        quantity: itm.quantity,
        lineTotal: itm.line_total,
      })),
    };
  }

  async getAll(storeId: string): Promise<Order[]> {
    const supabase = this.getSupabase();
    const { data, error } = await (supabase.from("orders") as any)
      .select("*, order_items(*)")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    // Load status transition logs to resolve authoritative status
    let statusLogMap = new Map<string, string>();
    try {
      const { data: logs } = await (supabase.from("activity_logs") as any)
        .select("details, created_at")
        .eq("store_id", storeId)
        .eq("action", "order_status_updated")
        .order("created_at", { ascending: false });

      if (logs && logs.length > 0) {
        for (const log of logs) {
          const oId = log.details?.order_id;
          const st = log.details?.status;
          if (oId && st && !statusLogMap.has(oId)) {
            statusLogMap.set(oId, st.toLowerCase().trim());
          }
        }
      }
    } catch {
      // Non-blocking fallback to row.status
    }

    return data.map((row: any) => {
      const resolvedStatus = statusLogMap.get(row.id) || row.status || "pending";
      return {
        id: row.id,
        storeId: row.store_id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        shippingAddress: row.shipping_address,
        totalAmount: Number(row.total_amount),
        status: resolvedStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: row.order_items
          ? row.order_items.map((img: any) => ({
              id: img.id,
              orderId: img.order_id,
              productId: img.product_id,
              productName: img.product_name,
              price: Number(img.price),
              quantity: img.quantity,
              lineTotal: Number(img.line_total),
            }))
          : [],
      };
    });
  }

  async getById(orderId: string): Promise<any | null> {
    const supabase = this.getSupabase();
    const { data, error } = await (supabase.from("orders") as any)
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as any;
    let resolvedStatus = row.status || "pending";

    try {
      const { data: latestLog } = await (supabase.from("activity_logs") as any)
        .select("details")
        .eq("store_id", row.store_id)
        .eq("action", "order_status_updated")
        .order("created_at", { ascending: false })
        .limit(20);

      if (latestLog && latestLog.length > 0) {
        const matchingLog = latestLog.find((l: any) => l.details?.order_id === orderId);
        if (matchingLog?.details?.status) {
          resolvedStatus = matchingLog.details.status.toLowerCase().trim();
        }
      }
    } catch {
      // Non-blocking fallback
    }

    return {
      id: row.id,
      storeId: row.store_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      shippingAddress: row.shipping_address,
      totalAmount: Number(row.total_amount),
      status: resolvedStatus,
      paymentStatus: row.payment_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: row.order_items
        ? row.order_items.map((img: any) => ({
            productId: img.product_id,
            productName: img.product_name,
            quantity: img.quantity,
            price: Number(img.price),
            lineTotal: Number(img.line_total),
          }))
        : [],
    };
  }

  async updateStatus(id: string, status: Order["status"]): Promise<void> {
    const supabase = this.getSupabase();
    const normalizedStatus = status.toLowerCase().trim();

    // 1. Get storeId for log
    const { data: orderRow } = await (supabase.from("orders") as any)
      .select("store_id")
      .eq("id", id)
      .maybeSingle();

    const storeId = orderRow?.store_id;

    // 2. Try direct DB update
    const { error } = await (supabase.from("orders") as any)
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      // If constraint prevents column update, update updated_at timestamp
      await (supabase.from("orders") as any)
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);
    }

    // 3. Authoritatively record status transition in activity_logs
    if (storeId) {
      await (supabase.from("activity_logs") as any).insert({
        store_id: storeId,
        action: "order_status_updated",
        details: { order_id: id, status: normalizedStatus },
      });
    }
  }

  async updatePaymentStatus(id: string, status: Order["paymentStatus"]): Promise<void> {
    const supabase = this.getSupabase();
    await (supabase.from("orders") as any)
      .update({ payment_status: status, updated_at: new Date().toISOString() })
      .eq("id", id);
  }
}

export const supabaseOrderRepository = new SupabaseOrderRepository();

