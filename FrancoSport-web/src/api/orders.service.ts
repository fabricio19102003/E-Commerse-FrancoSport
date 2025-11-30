/**
 * Orders Service
 * Franco Sport E-Commerce
 * 
 * Servicio para gestión de pedidos
 */

import { api } from './axios';
import type { Order, CancelOrderInput } from '@/types';

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
export const createOrder = async (data: any): Promise<Order> => {
  const response = await api.post<{ success: boolean; data: Order }>('/orders', data);
  return response.data.data;
};
