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

/** POST /coupons/validate: the subtotal is computed by the server from the items (never sent by the client) */
export interface ValidateCouponInput {
  code: string;
  /** Required for FREE_SHIPPING coupons: their discount is this method's shipping cost */
  shipping_method_id?: number;
  items?: { product_id: number; variant_id?: number | null; quantity: number }[];
}

/** Discount the server computes for the cart; the amounts are decimal strings ("12.50") */
export interface CouponPreview {
  code: string;
  description: string;
  discount_type: DiscountType;
  /** What the discount comes off: the shipping cost (FREE_SHIPPING) or the products subtotal */
  applies_to: 'SHIPPING' | 'SUBTOTAL';
  subtotal: string;
  /** Shipping cost of the chosen method; null when no method was sent */
  shipping_cost: string | null;
  discount_amount: string;
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
