/**
 * Users Service
 * Franco Sport E-Commerce
 * 
 * Servicio para gestión de usuarios
 */

import { api } from './axios';
import { STORAGE_KEYS } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';
import type { 
  User, 
  UpdateUserInput, 
  ChangePasswordInput,
  Address,
  CreateAddressInput 
} from '@/types';

/**
 * Get user profile
 */
export const getProfile = async (): Promise<User> => {
  const response = await api.get<{ success: boolean; data: User }>('/users/profile');
  return response.data.data;
};

/**
 * Update user profile
 */
export const updateProfile = async (data: UpdateUserInput): Promise<User> => {
  const response = await api.put<{ success: boolean; data: User }>('/users/profile', data);
  return response.data.data;
};

/**
 * Change password. The API ends the user's other sessions and answers with a fresh
 * access and refresh token, which replace the stored ones so this session continues.
 */
export const changePassword = async (data: ChangePasswordInput): Promise<void> => {
  const response = await api.put<{ success: boolean; data: { token: string; refreshToken: string } }>(
    '/users/password',
    data
  );
  const { token, refreshToken } = response.data.data;
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  useAuthStore.getState().setToken(token);
};

/**
 * Get user addresses
 */
export const getAddresses = async (): Promise<Address[]> => {
  const response = await api.get<{ success: boolean; data: Address[] }>('/users/addresses');
  return response.data.data;
};

/**
 * Create address
 */
export const createAddress = async (data: CreateAddressInput): Promise<Address> => {
  const response = await api.post<{ success: boolean; data: Address }>('/users/addresses', data);
  return response.data.data;
};

/**
 * Update address
 */
export const updateAddress = async (addressId: number, data: CreateAddressInput): Promise<Address> => {
  const response = await api.put<{ success: boolean; data: Address }>(
    `/users/addresses/${addressId}`,
    data
  );
  return response.data.data;
};

/**
 * Delete address
 */
export const deleteAddress = async (addressId: number): Promise<void> => {
  await api.delete(`/users/addresses/${addressId}`);
};
