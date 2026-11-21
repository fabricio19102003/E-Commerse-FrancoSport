/**
 * Orders Service
 * Franco Sport E-Commerce
 * 
 * Servicio para gestión de pedidos
 */

import { api } from './axios';
import type { Order, CheckoutData } from '@/types';

/**
 * Get user's orders
 */
export const getOrders = async (status?: string): Promise<Order[]> => {
  const response = await api.get<{ success: boolean; data: Order[] }>(
    '/orders',
    { params: status ? { status } : undefined }
  );
  return response.data.data;
};

/**
 * Get single order by order number
 */
export const getOrder = async (orderNumber: string): Promise<Order> => {
  const response = await api.get<{ success: boolean; data: Order }>(`/orders/${orderNumber}`);
  return response.data.data;
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderNumber: string, reason: string): Promise<void> => {
  await api.post(`/orders/${orderNumber}/cancel`, { reason });
};

/**
 * Create order
 */
export interface CreateOrderPayload extends CheckoutData {
  items: { product_id: number; variant_id?: number; quantity: number }[];
  /** A coupon or points, never both (the API rejects both) */
  redeem_points?: number;
  coupon_code?: string;
}

export const createOrder = async (data: CreateOrderPayload): Promise<Order> => {
  const response = await api.post<{ success: boolean; data: Order }>('/orders', data);
  return response.data.data;
};
