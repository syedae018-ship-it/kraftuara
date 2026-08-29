/**
 * Canonical Order Status and Types for Kraftaura
 * Master Source of Truth for Order Management & Tracking
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const CANONICAL_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  storeId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  couponCode?: string | null;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}
