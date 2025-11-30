/**
 * Products Service
 * Franco Sport E-Commerce
 * 
 * Servicio para gestión de productos
 */

import { api } from './axios';
import type {
  Product,
  ProductFilters,
  ProductListResponse,
  Category,
  Brand,
  Review,
  CreateReviewInput
} from '@/types';

/**
 * Get all products with filters
 */
export const getProducts = async (filters?: ProductFilters): Promise<ProductListResponse> => {
  const response = await api.get<{ success: boolean; data: Product[]; pagination: any }>(
    '/products',
    { params: filters }
  );

  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (slug: string): Promise<Product> => {
  const response = await api.get<{ success: boolean; data: Product }>(`/products/${slug}`);
  return response.data.data;
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<{ success: boolean; data: Category[] }>('/products/categories');
  return response.data.data;
};

/**
 * Get all brands
 */
export const getBrands = async (): Promise<Brand[]> => {
  const response = await api.get<{ success: boolean; data: Brand[] }>('/products/brands');
  return response.data.data;
};

/**
 * Get product reviews
 */
export const getProductReviews = async (productId: number): Promise<Review[]> => {
  const response = await api.get<{ success: boolean; data: Review[] }>(`/products/${productId}/reviews`);
  return response.data.data;
};

/**
 * Create product review
 */
export const createProductReview = async (data: CreateReviewInput): Promise<Review> => {
  const response = await api.post<{ success: boolean; data: Review }>('/reviews', data);
  return response.data.data;
};
