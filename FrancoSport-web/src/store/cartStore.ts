/**
 * Cart Store
 * Franco Sport E-Commerce
 * 
 * Maneja el estado del carrito de compras
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart, CartItem, Product, ProductVariant, AddToCartInput } from '@/types';
import { STORAGE_KEYS } from '@/constants/config';
import * as cartService from '@/api/cart.service';

// ===== TYPES =====

interface CartState {
  // State
  cart: Cart | null;
  items: CartItem[];
  isLoading: boolean;
  error: string | null;

  // Computed
  itemsCount: number;
  subtotal: number;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ===== HELPER FUNCTIONS =====

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + (item.subtotal || 0), 0);
}

function calculateItemsCount(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

// ===== STORE =====

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // ===== INITIAL STATE =====
      cart: null,
      items: [],
      isLoading: false,
      error: null,
      itemsCount: 0,
      subtotal: 0,

      // ===== SETTERS =====
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      reset: () => set({ cart: null, items: [], itemsCount: 0, subtotal: 0, error: null }),

      // ===== FETCH CART =====
      fetchCart: async () => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          setError(null);
          const cart = await cartService.getCart();
          set({
            cart,
            items: cart.items,
            itemsCount: calculateItemsCount(cart.items),
            subtotal: cart.subtotal || calculateSubtotal(cart.items),
          });
        } catch (error) {
          // If 404, it might mean no cart exists yet, which is fine
          console.error('Error fetching cart:', error);
          // Don't set error for 404 on fetch, just reset
          // set({ cart: null, items: [], itemsCount: 0, subtotal: 0 });
        } finally {
          setLoading(false);
        }
      },

      // ===== ADD ITEM =====
      addItem: async (product, variant, quantity = 1) => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          setError(null);

          const input: AddToCartInput = {
            product_id: product.id,
            variant_id: variant?.id,
            quantity,
          };

          const cart = await cartService.addToCart(input);

          set({
            cart,
            items: cart.items,
            itemsCount: calculateItemsCount(cart.items),
            subtotal: cart.subtotal || calculateSubtotal(cart.items),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al agregar al carrito';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // ===== UPDATE QUANTITY =====
      updateQuantity: async (itemId, quantity) => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          setError(null);

          if (quantity <= 0) {
            await get().removeItem(itemId);
            return;
          }

          const cart = await cartService.updateCartItem(itemId, quantity);

          set({
            cart,
            items: cart.items,
            itemsCount: calculateItemsCount(cart.items),
            subtotal: cart.subtotal || calculateSubtotal(cart.items),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al actualizar carrito';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // ===== REMOVE ITEM =====
      removeItem: async (itemId) => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          setError(null);

          const cart = await cartService.removeFromCart(itemId);

          set({
            cart,
            items: cart.items,
            itemsCount: calculateItemsCount(cart.items),
            subtotal: cart.subtotal || calculateSubtotal(cart.items),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al eliminar del carrito';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // ===== CLEAR CART =====
      clearCart: async () => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          setError(null);

          await cartService.clearCart();

          set({
            cart: null,
            items: [],
            itemsCount: 0,
            subtotal: 0,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al vaciar carrito';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },
    }),
    {
      name: STORAGE_KEYS.CART_STORE,
      partialize: (state) => ({
        // We might not want to persist everything if we rely on server
        // But persisting helps with offline or quick load
        cart: state.cart,
        items: state.items,
        itemsCount: state.itemsCount,
        subtotal: state.subtotal,
      }),
    }
  )
);

// ===== SELECTORS =====

export const useCart = () => useCartStore((state) => state.cart);
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartItemsCount = () => useCartStore((state) => state.itemsCount);
export const useCartSubtotal = () => useCartStore((state) => state.subtotal);
export const useCartLoading = () => useCartStore((state) => state.isLoading);
export const useCartError = () => useCartStore((state) => state.error);

// Helper para verificar si un producto está en el carrito
export const useIsInCart = (productId: number, variantId?: number) => {
  return useCartStore((state) =>
    state.items.some(
      (item) =>
        item.product_id === productId &&
        (variantId ? item.variant_id === variantId : !item.variant_id)
    )
  );
};
