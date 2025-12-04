import axios from './axios';
import type { Product } from '@/types';

export interface WishlistItem extends Product {
    added_to_wishlist_at: string;
}

export const getWishlist = async (): Promise<WishlistItem[]> => {
    const response = await axios.get('/wishlist');
    return response.data;
};

export const addToWishlist = async (productId: number): Promise<any> => {
    const response = await axios.post('/wishlist', { productId });
    return response.data;
};

export const removeFromWishlist = async (productId: number): Promise<any> => {
    const response = await axios.delete(`/wishlist/${productId}`);
    return response.data;
};
