/**
 * Cart Types
 * Franco Sport E-Commerce
 */

import type { Product, ProductVariant } from './product';

// ===== CART INTERFACES =====

export interface Cart {
  id: number;
  user_id?: number;
  session_id?: string;
  items: CartItem[];
  subtotal: number;
  items_count: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  product?: Product;
  variant_id?: number;
  variant?: ProductVariant;
  quantity: number;
  price_at_add: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

// ===== ADD TO CART =====

export interface AddToCartInput {
  product_id: number;
  variant_id?: number;
  quantity: number;
}

// ===== UPDATE CART ITEM =====

export interface UpdateCartItemInput {
  cart_item_id: number;
  quantity: number;
}

// ===== CART SUMMARY =====

export interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  items_count: number;
}

// ===== LOCAL CART (For guests in localStorage) =====

export interface LocalCart {
  items: LocalCartItem[];
  session_id: string;
  created_at: string;
  updated_at: string;
}

export interface LocalCartItem {
  product_id: number;
  variant_id?: number;
  quantity: number;
  added_at: string;
}
