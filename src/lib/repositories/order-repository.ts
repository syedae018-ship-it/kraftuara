

export interface OrderItemInput {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
  shippingAddress: string;
  couponCode?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  paymentStatus?: "unpaid" | "paid" | "refunded";
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  items?: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }[];
}

export interface OrderDetail extends Order {
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }[];
}

export interface IOrderRepository {
  createOrder(storeId: string, customer: CustomerInput, items: OrderItemInput[]): Promise<Order>;
  getAll(storeId: string): Promise<Order[]>;
  getById(orderId: string): Promise<OrderDetail | null>;
  updateStatus(orderId: string, status: Order["status"]): Promise<void>;
  updatePaymentStatus(orderId: string, status: Order["paymentStatus"]): Promise<void>;
}

export { supabaseOrderRepository as orderRepository } from "./supabase/supabase-order-repository";
