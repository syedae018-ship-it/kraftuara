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
    return { success: false, error: err.message || "Failed to place order. Please try again." };
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

export async function updateOrderStatusAction(orderId: string, status: "pending" | "processing" | "completed" | "cancelled") {
  try {
    const supabase = await createServerInstance();
    await verifyOrderStoreOwner(supabase, orderId);
    
    const { error } = await (supabase.from("orders") as any)
      .update({ status })
      .eq("id", orderId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update status" };
  }
}
