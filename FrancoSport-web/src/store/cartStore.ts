/**
 * Cart Store
 * Franco Sport E-Commerce
 * 
 * Maneja el estado del carrito de compras
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant } from '@/types';
import { STORAGE_KEYS } from '@/constants/config';

// ===== TYPES =====

interface CartState {
  // State
  items: CartItem[];
  isLoading: boolean;
  error: string | null;

  // Computed
  itemsCount: number;
  subtotal: number;

  // Actions
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  removeItem: (itemId: number) => void;
  clearCart: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Sync with server (cuando esté el API)
  syncWithServer: () => Promise<void>;
}

// ===== HELPER FUNCTIONS =====

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.subtotal, 0);
}

function calculateItemsCount(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

// ===== STORE =====

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // ===== INITIAL STATE =====
      items: [],
      isLoading: false,
      error: null,
      itemsCount: 0,
      subtotal: 0,

      // ===== ADD ITEM =====
      addItem: (product, variant, quantity = 1) => {
        const { items } = get();

        // Verificar stock
        const availableStock = variant ? variant.stock : product.stock;
        if (availableStock < quantity) {
          set({ error: 'Stock insuficiente' });
          return;
        }

        // Verificar si el item ya existe
        const existingItemIndex = items.findIndex(
          (item) =>
            item.product_id === product.id &&
            (variant ? item.variant_id === variant.id : !item.variant_id)
        );

        let newItems: CartItem[];

        if (existingItemIndex > -1) {
          // Actualizar cantidad del item existente
          newItems = [...items];
          const existingItem = newItems[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;

          // Verificar stock nuevamente
          if (availableStock < newQuantity) {
            set({ error: 'No hay suficiente stock disponible' });
            return;
          }

          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            subtotal: (variant?.price || product.price) * newQuantity,
          };
        } else {
          // Agregar nuevo item
          const newItem: CartItem = {
            id: Date.now(), // ID temporal (se reemplazará con el del servidor)
            cart_id: 0, // Se asignará cuando se sincronice con el servidor
            product_id: product.id,
            product,
            variant_id: variant?.id,
            variant,
            quantity,
            price_at_add: variant?.price || product.price,
            subtotal: (variant?.price || product.price) * quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          newItems = [...items, newItem];
        }

        set({
          items: newItems,
          itemsCount: calculateItemsCount(newItems),
          subtotal: calculateSubtotal(newItems),
          error: null,
        });
      },

      // ===== UPDATE QUANTITY =====
      updateQuantity: (itemId, quantity) => {
        const { items } = get();

        if (quantity <= 0) {
          // Si la cantidad es 0 o negativa, eliminar el item
          get().removeItem(itemId);
          return;
        }

        const newItems = items.map((item) => {
          if (item.id === itemId) {
            // Verificar stock
            const availableStock = item.variant ? item.variant.stock : item.product!.stock;
            
            if (availableStock < quantity) {
              set({ error: `Solo hay ${availableStock} unidades disponibles` });
              return item;
            }

            return {
              ...item,
              quantity,
              subtotal: item.price_at_add * quantity,
              updated_at: new Date().toISOString(),
            };
          }
          return item;
        });

        set({
          items: newItems,
          itemsCount: calculateItemsCount(newItems),
          subtotal: calculateSubtotal(newItems),
          error: null,
        });
      },

      // ===== REMOVE ITEM =====
      removeItem: (itemId) => {
        const { items } = get();
        const newItems = items.filter((item) => item.id !== itemId);

        set({
          items: newItems,
          itemsCount: calculateItemsCount(newItems),
          subtotal: calculateSubtotal(newItems),
          error: null,
        });
      },

      // ===== CLEAR CART =====
      clearCart: () => {
        set({
          items: [],
          itemsCount: 0,
          subtotal: 0,
          error: null,
        });
      },

      // ===== SETTERS =====
      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      // ===== SYNC WITH SERVER =====
      syncWithServer: async () => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(null);

          // TODO: Implementar sincronización con el servidor
          // 1. Enviar items locales al servidor
          // 2. Recibir cart_id y cart_item_ids del servidor
          // 3. Actualizar items con los IDs del servidor

          console.log('🔄 Sync with server - TODO');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al sincronizar carrito';
          setError(message);
        } finally {
          setLoading(false);
        }
      },
    }),
    {
      name: STORAGE_KEYS.CART_STORE, // Key en localStorage
      partialize: (state) => ({
        items: state.items,
      }), // Solo persistir items
      onRehydrateStorage: () => (state) => {
        // Recalcular computed values después de hidratar
        if (state) {
          state.itemsCount = calculateItemsCount(state.items);
          state.subtotal = calculateSubtotal(state.items);
        }
      },
    }
  )
);

// ===== SELECTORS =====

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
