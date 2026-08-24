import { Order, OrderItemInput, CustomerInput, IOrderRepository } from "../order-repository";
import { createClient } from "@/lib/supabase/client";
import { DEMO_STORE_PRODUCTS } from "@/lib/demo-data";

export class SupabaseOrderRepository implements IOrderRepository {
  private getSupabase() {
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

      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
      const orderNumber = `DEMO-${dateStr}-${randomSuffix}`;

      return {
        id: `demo-order-${Date.now()}`,
        storeId,
        orderNumber,
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        shippingAddress: customer.shippingAddress.trim(),
        totalAmount: calculatedTotal,
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

    // 5. Generate unique order reference number
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
    const orderNumber = `SK-${dateStr}-${randomSuffix}`;

    // 6. Insert order record
    const { data: orderRow, error: orderError } = await (supabase.from("orders") as any)
      .insert({
        store_id: storeId,
        order_number: orderNumber,
        customer_name: customer.name.trim(),
        customer_phone: customer.phone.trim(),
        shipping_address: customer.shippingAddress.trim(),
        total_amount: calculatedTotal,
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

    return data.map((row: any) => ({
      id: row.id,
      storeId: row.store_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      shippingAddress: row.shipping_address,
      totalAmount: Number(row.total_amount),
      status: row.status,
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
    }));
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
    return {
      id: row.id,
      storeId: row.store_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      shippingAddress: row.shipping_address,
      totalAmount: Number(row.total_amount),
      status: row.status,
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
    await (supabase.from("orders") as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  async updatePaymentStatus(id: string, status: Order["paymentStatus"]): Promise<void> {
    const supabase = this.getSupabase();
    await (supabase.from("orders") as any)
      .update({ payment_status: status, updated_at: new Date().toISOString() })
      .eq("id", id);
  }
}

export const supabaseOrderRepository = new SupabaseOrderRepository();
