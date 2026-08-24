import { CreativeService, CreativeOrder, CreateCreativeOrderInput } from "@/types/creative";
import type { ICreativeRepository } from "@/lib/repositories/creative-repository";
import { initialServices } from "@/lib/repositories/creative-constants";
import { createClient } from "@/lib/supabase/client";

export class SupabaseCreativeRepository implements ICreativeRepository {
  private getSupabase() {
    return createClient();
  }

  async getServices(): Promise<CreativeService[]> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase.from("creative_services").select("*");

    if (error || !data || data.length === 0) {
      return [...initialServices];
    }

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      description: row.description,
      startingPrice: Number(row.starting_price),
      deliveryTime: row.delivery_time,
      iconName: row.icon_name || "Sparkles",
      coverImage: row.cover_image_url,
    }));
  }

  async getServiceById(id: string): Promise<CreativeService | null> {
    const services = await this.getServices();
    return services.find((s) => s.id === id) || null;
  }

  async getOrders(): Promise<CreativeOrder[]> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase.from("creative_orders").select("*").order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      serviceId: row.service_id || "",
      serviceTitle: row.service_title,
      projectTitle: row.project_title,
      requirements: row.requirements,
      deadline: row.deadline,
      priority: row.priority,
      status: row.status,
      attachments: [],
      referenceLinks: row.reference_links || [],
      notes: row.notes || undefined,
      createdAt: row.created_at,
      expectedDelivery: row.expected_delivery,
    }));
  }

  async getOrderById(id: string): Promise<CreativeOrder | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.id === id) || null;
  }

  async createOrder(input: CreateCreativeOrderInput): Promise<CreativeOrder> {
    const supabase = this.getSupabase();
    const orderNumber = `CRV-${Math.floor(Math.random() * 9000 + 1000)}`;
    const expected = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();

    const { data, error } = await supabase
      .from("creative_orders")
      .insert({
        order_number: orderNumber,
        store_id: "00000000-0000-0000-0000-000000000000",
        user_id: "00000000-0000-0000-0000-000000000000",
        service_id: input.serviceId,
        service_title: input.serviceTitle,
        project_title: input.projectTitle,
        requirements: input.requirements,
        deadline: input.deadline,
        priority: input.priority,
        status: "pending",
        reference_links: input.referenceLinks || [],
        notes: input.notes,
        expected_delivery: expected,
      } as any)
      .select()
      .single();

    if (error || !data) {
      return {
        ...input,
        id: `ord-cr-${Date.now()}`,
        orderNumber,
        status: "pending",
        createdAt: new Date().toISOString(),
        expectedDelivery: expected,
      };
    }

    return {
      id: (data as any).id,
      orderNumber: (data as any).order_number,
      serviceId: (data as any).service_id,
      serviceTitle: (data as any).service_title,
      projectTitle: (data as any).project_title,
      requirements: (data as any).requirements,
      deadline: (data as any).deadline,
      priority: (data as any).priority,
      status: (data as any).status,
      attachments: [],
      referenceLinks: (data as any).reference_links || [],
      notes: (data as any).notes || undefined,
      createdAt: (data as any).created_at,
      expectedDelivery: (data as any).expected_delivery,
    };
  }
}

export const supabaseCreativeRepository = new SupabaseCreativeRepository();
