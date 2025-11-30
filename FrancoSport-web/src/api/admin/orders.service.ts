/**
 * Admin Orders Service
 * Franco Sport E-Commerce
 * 
 * Servicio para gestión administrativa de pedidos
 */

import { api } from '../axios';
import type { Order } from '@/types';

export interface UpdateOrderStatusData {
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  tracking_number?: string;
  notes?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

/**
 * Get all orders (admin view)
 */
export const getOrders = async (filters?: {
  status?: string;
  payment_status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get<{ success: boolean; data: Order[]; pagination: any }>(
    '/admin/orders',
    { params: filters }
  );
  return response.data;
};

/**
 * Get single order by order number (admin)
 */
export const getOrder = async (orderNumber: string) => {
  const response = await api.get<{ success: boolean; data: Order }>(
    `/admin/orders/${orderNumber}`
  );
  return response.data.data;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderNumber: string, data: UpdateOrderStatusData) => {
  const response = await api.patch<{ success: boolean; data: Order }>(
    `/admin/orders/${orderNumber}/status`,
    data
  );
  return response.data.data;
};

/**
 * Add tracking number to order
 */
export const addTrackingNumber = async (orderNumber: string, trackingNumber: string) => {
  const response = await api.patch<{ success: boolean; data: Order }>(
    `/admin/orders/${orderNumber}/tracking`,
    { tracking_number: trackingNumber }
  );
  return response.data.data;
};

/**
 * Get order statistics
 */
export const getOrderStats = async () => {
  const response = await api.get<{ success: boolean; data: OrderStats }>(
    '/admin/orders/stats'
  );
  return response.data.data;
};

/**
 * Export orders to CSV
 */
export const exportOrders = async (filters?: { status?: string; from?: string; to?: string }) => {
  const response = await api.get('/admin/orders/export', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Cancel order (admin action)
 */
export const cancelOrder = async (orderNumber: string, reason: string) => {
  const response = await api.post<{ success: boolean; data: Order }>(
    `/admin/orders/${orderNumber}/cancel`,
    { reason }
  );
  return response.data.data;
};
