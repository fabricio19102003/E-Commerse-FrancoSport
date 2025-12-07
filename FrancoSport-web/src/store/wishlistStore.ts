import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { STORAGE_KEYS } from '@/constants/config';
import * as wishlistService from '@/api/wishlist.service';
import { useAuthStore } from './authStore';

interface WishlistState {
    items: Product[];
    isLoading: boolean;
    fetchWishlist: () => Promise<void>;
    addItem: (product: Product) => Promise<void>;
    removeItem: (productId: number) => Promise<void>;
    isInWishlist: (productId: number) => boolean;
    clearWishlist: () => void;
    syncWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            isLoading: false,

            fetchWishlist: async () => {
                const isAuthenticated = useAuthStore.getState().isAuthenticated;
                if (!isAuthenticated) return;

                set({ isLoading: true });
                try {
                    const items = await wishlistService.getWishlist();
                    // The API returns WishlistItem[] which extends Product, so this is compatible
                    set({ items });
                } catch (error) {
                    console.error('Error fetching wishlist:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            addItem: async (product) => {
                const { items } = get();
                const isAuthenticated = useAuthStore.getState().isAuthenticated;

                // Optimistic update
                if (!items.some((item) => item.id === product.id)) {
                    set({ items: [...items, product] });
                }

                if (isAuthenticated) {
                    try {
                        await wishlistService.addToWishlist(product.id);
                    } catch (error) {
                        console.error('Error adding to wishlist:', error);
                        // Revert if failed
                        set({ items: items.filter((item) => item.id !== product.id) });
                    }
                }
            },

            removeItem: async (productId) => {
                const { items } = get();
                const isAuthenticated = useAuthStore.getState().isAuthenticated;

                // Optimistic update
                set({ items: items.filter((item) => item.id !== productId) });

                if (isAuthenticated) {
                    try {
                        await wishlistService.removeFromWishlist(productId);
                    } catch (error) {
                        console.error('Error removing from wishlist:', error);
                        // Revert if failed (complex to revert delete without the item object, 
                        // but usually we can just re-fetch or ignore)
                        // For now, we'll just log the error.
                    }
                }
            },

            isInWishlist: (productId) => {
                const { items } = get();
                return items.some((item) => item.id === productId);
            },

            clearWishlist: () => set({ items: [] }),

            syncWishlist: async () => {
                const isAuthenticated = useAuthStore.getState().isAuthenticated;
                if (isAuthenticated) {
                    await get().fetchWishlist();
                }
            }
        }),
        {
            name: STORAGE_KEYS.WISHLIST,
            partialize: (state) => ({ items: state.items }), // Only persist items
        }
    )
);
