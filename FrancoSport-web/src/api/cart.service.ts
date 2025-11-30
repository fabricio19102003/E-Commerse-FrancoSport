/**
 * Cart Service
 * Franco Sport E-Commerce
 * 
 * Servicio para gestión del carrito de compras
 */

import { api } from './axios';
import type { Cart, AddToCartInput, UpdateCartItemInput } from '@/types';

/**
 * Get user's cart
 */
export const getCart = async (): Promise<Cart> => {
  const response = await api.get<{ success: boolean; data: Cart }>('/cart');
  return response.data.data;
};

/**
 * Add item to cart
 */
export const addToCart = async (data: AddToCartInput): Promise<Cart> => {
  const response = await api.post<{ success: boolean; data: Cart }>('/cart/items', data);
  return response.data.data;
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (itemId: number, quantity: number): Promise<Cart> => {
  const response = await api.put<{ success: boolean; data: Cart }>(
    `/cart/items/${itemId}`,
    { quantity }
  );
  return response.data.data;
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId: number): Promise<Cart> => {
  const response = await api.delete<{ success: boolean; data: Cart }>(`/cart/items/${itemId}`);
  return response.data.data;
};

/**
 * Clear cart
 */
export const clearCart = async (): Promise<void> => {
  await api.delete('/cart');
};
