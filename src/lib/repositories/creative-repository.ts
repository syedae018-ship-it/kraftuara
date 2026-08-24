import { CreativeService, CreativeOrder, CreateCreativeOrderInput } from "@/types/creative";


export interface ICreativeRepository {
  getServices(): Promise<CreativeService[]>;
  getServiceById(id: string): Promise<CreativeService | null>;
  getOrders(): Promise<CreativeOrder[]>;
  getOrderById(id: string): Promise<CreativeOrder | null>;
  createOrder(input: CreateCreativeOrderInput): Promise<CreativeOrder>;
}

export * from "./creative-constants";

export { supabaseCreativeRepository as creativeRepository } from "./supabase/supabase-creative-repository";
