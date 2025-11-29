/**
 * Order Types
 * Franco Sport E-Commerce
 */

import type { Product, ProductVariant } from './product';
import type { Address } from './user';

// ===== "ENUMS" COMO OBJETOS =====

export const OrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// ===== ORDER INTERFACES =====

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  payment_id?: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_address_id: number;
  shipping_address?: Address;
  shipping_method_id: number;
  shipping_method?: ShippingMethod;
  tracking_number?: string;
  coupon_id?: number;
  coupon_code?: string;
  items: OrderItem[];
  status_history?: OrderStatusHistory[];
  notes?: string;
  admin_notes?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  variant_id?: number;
  variant?: ProductVariant;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price_at_purchase: number;
  subtotal: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: OrderStatus;
  notes?: string;
  created_by?: number;
  created_at: string;
}

// ===== SHIPPING =====

export interface ShippingMethod {
  id: number;
  name: string;
  description?: string;
  base_cost: number;
  cost_per_kg: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  shipping_zone_id: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingZone {
  id: number;
  name: string;
  countries: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===== CHECKOUT =====

export interface CheckoutData {
  shipping_address_id: number;
  shipping_method_id: number;
  coupon_code?: string;
  payment_method: string;
  notes?: string;
}

export interface CheckoutResponse {
  order: Order;
  payment_intent_client_secret?: string; // For Stripe
}

// ===== CANCEL ORDER =====

export interface CancelOrderInput {
  order_id: number;
  reason: string;
}

// ===== ORDER FILTERS =====

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  search?: string; // Search by order number or customer email
  page?: number;
  limit?: number;
}

// ===== ORDER LIST RESPONSE =====

export interface OrderListResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ===== UPDATE ORDER STATUS (ADMIN) =====

export interface UpdateOrderStatusInput {
  order_id: number;
  status: OrderStatus;
  notes?: string;
  tracking_number?: string;
}
