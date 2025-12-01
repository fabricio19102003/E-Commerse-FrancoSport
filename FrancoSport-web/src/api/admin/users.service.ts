/**
 * Admin Users Service
 * Franco Sport E-Commerce
 * 
 * Servicio para gestión administrativa de usuarios
 */

import { api } from '../axios';
import type { User } from '@/types';

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  customers: number;
  admins: number;
  moderators: number;
  totalRevenue: number;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: 'ADMIN' | 'CUSTOMER' | 'MODERATOR';
  is_active?: boolean;
  email_verified?: boolean;
}

/**
 * Get all users (admin view)
 */
export const getUsers = async (filters?: {
  role?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get<{ success: boolean; data: User[]; pagination: any }>(
    '/admin/users',
    { params: filters }
  );
  return response.data;
};

/**
 * Get single user by ID (admin)
 */
export const getUser = async (userId: number) => {
  const response = await api.get<{ success: boolean; data: User }>(
    `/admin/users/${userId}`
  );
  return response.data.data;
};

/**
 * Update user
 */
export const updateUser = async (userId: number, data: UpdateUserData) => {
  const response = await api.put<{ success: boolean; data: User }>(
    `/admin/users/${userId}`,
    data
  );
  return response.data.data;
};

/**
 * Toggle user active status
 */
export const toggleUserStatus = async (userId: number) => {
  const response = await api.patch<{ success: boolean; data: User }>(
    `/admin/users/${userId}/toggle-status`
  );
  return response.data.data;
};

/**
 * Change user role
 */
export const changeUserRole = async (userId: number, role: 'ADMIN' | 'CUSTOMER' | 'MODERATOR') => {
  const response = await api.patch<{ success: boolean; data: User }>(
    `/admin/users/${userId}/role`,
    { role }
  );
  return response.data.data;
};

/**
 * Change user password
 */
export const changeUserPassword = async (userId: number, password: string) => {
  const response = await api.patch<{ success: boolean; message: string }>(
    `/admin/users/${userId}/password`,
    { password }
  );
  return response.data;
};

/**
 * Delete user (soft delete)
 */
export const deleteUser = async (userId: number) => {
  await api.delete(`/admin/users/${userId}`);
};

/**
 * Get user statistics
 */
export const getUserStats = async () => {
  const response = await api.get<{ success: boolean; data: UserStats }>(
    '/admin/users/stats'
  );
  return response.data.data;
};

/**
 * Get user order history (admin view)
 */
export const getUserOrders = async (userId: number) => {
  const response = await api.get<{ success: boolean; data: any[] }>(
    `/admin/users/${userId}/orders`
  );
  return response.data.data;
};
