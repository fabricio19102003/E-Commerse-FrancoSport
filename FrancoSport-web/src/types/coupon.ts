/**
 * Coupon Types
 * Franco Sport E-Commerce
 */

// ===== "ENUM" LIKE OBJECT =====

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_SHIPPING: 'FREE_SHIPPING',
} as const;

// Tipo union de los valores del objeto
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

// ===== COUPON INTERFACES =====

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_purchase_amount?: number;
  maximum_discount_amount?: number;
  usage_limit_total?: number;
  usage_limit_per_user?: number;
  times_used: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValidateCouponInput {
  code: string;
  cart_subtotal: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  coupon?: Coupon;
  discount_amount?: number;
  message?: string;
}

// ===== CREATE/UPDATE COUPON (Admin) =====

export interface CreateCouponInput {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_purchase_amount?: number;
  maximum_discount_amount?: number;
  usage_limit_total?: number;
  usage_limit_per_user?: number;
  starts_at: string;
  expires_at: string;
  is_active?: boolean;
}

export interface UpdateCouponInput extends Partial<CreateCouponInput> {
  id: number;
}
