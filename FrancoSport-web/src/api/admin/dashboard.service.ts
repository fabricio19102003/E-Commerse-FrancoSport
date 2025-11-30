/**
 * Admin Dashboard Service
 * Franco Sport E-Commerce
 * 
 * Servicio para métricas y estadísticas del dashboard
 */

import { api } from '../axios';

export interface DashboardStats {
  // Sales
  totalSales: number;
  salesGrowth: number;
  salesByDay: { date: string; amount: number }[];
  
  // Orders
  totalOrders: number;
  ordersGrowth: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  
  // Customers
  totalCustomers: number;
  customersGrowth: number;
  newCustomersThisMonth: number;
  
  // Products
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  featuredProducts: number;
  
  // Revenue
  totalRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
}

export interface RecentOrder {
  id: number;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  total: number;
  status: string;
  createdAt: string;
}

export interface TopProduct {
  id: number;
  name: string;
  image: string;
  soldCount: number;
  revenue: number;
}

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
  const response = await api.get<{ success: boolean; data: DashboardStats }>(
    '/admin/dashboard/stats'
  );
  return response.data.data;
};

/**
 * Get recent orders
 */
export const getRecentOrders = async (limit: number = 10) => {
  const response = await api.get<{ success: boolean; data: RecentOrder[] }>(
    '/admin/dashboard/recent-orders',
    { params: { limit } }
  );
  return response.data.data;
};

/**
 * Get top selling products
 */
export const getTopProducts = async (limit: number = 5) => {
  const response = await api.get<{ success: boolean; data: TopProduct[] }>(
    '/admin/dashboard/top-products',
    { params: { limit } }
  );
  return response.data.data;
};

/**
 * Get sales by period
 */
export const getSalesByPeriod = async (period: 'day' | 'week' | 'month' | 'year') => {
  const response = await api.get<{ success: boolean; data: any[] }>(
    '/admin/dashboard/sales',
    { params: { period } }
  );
  return response.data.data;
};
