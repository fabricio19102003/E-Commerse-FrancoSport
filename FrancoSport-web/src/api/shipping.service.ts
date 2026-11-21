/**
 * Shipping Service
 * Franco Sport E-Commerce
 *
 * Métodos de envío disponibles para el checkout
 */

import { api } from './axios';
import type { AvailableShippingMethod } from '@/types';

/**
 * Get active shipping methods (active zones only)
 */
export const getShippingMethods = async (): Promise<AvailableShippingMethod[]> => {
  const response = await api.get<{ success: boolean; data: AvailableShippingMethod[] }>('/shipping-methods');
  return response.data.data;
};
