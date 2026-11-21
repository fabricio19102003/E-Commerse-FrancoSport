/**
 * Coupons Service
 * Franco Sport E-Commerce
 *
 * Cupones del cliente en el checkout (el descuento lo calcula siempre el servidor)
 */

import { api } from './axios';
import type { CouponPreview, ValidateCouponInput } from '@/types';

/**
 * Validate a coupon code against the cart and get the discount the order would be charged.
 * Rejects with the API's Spanish message (see getErrorMessage) when the coupon cannot be used.
 */
export const validateCoupon = async (input: ValidateCouponInput): Promise<CouponPreview> => {
  const response = await api.post<{ success: boolean; data: CouponPreview }>('/coupons/validate', input);
  return response.data.data;
};
