/**
 * Admin Products Service
 * Franco Sport E-Commerce
 * 
 * Servicio para gestión administrativa de productos
 */

import { api } from '../axios';
import type { Product, ProductFilters } from '@/types';

export interface CreateProductData {
  name: string;
  slug: string;
  short_description?: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_price: number;
  sku: string;
  barcode?: string;
  stock: number;
  low_stock_threshold: number;
  weight: number;
  category_id: number;
  brand_id: number;
  is_featured: boolean;
  is_active: boolean;
  meta_title?: string;
  meta_description?: string;
  images: {
    url: string;
    is_primary: boolean;
    display_order: number;
    alt_text?: string;
  }[];
}

export interface UpdateProductData extends Partial<CreateProductData> {}

/**
 * Get all products (admin view - includes inactive)
 */
export const getProducts = async (filters?: ProductFilters) => {
  const response = await api.get<{ success: boolean; data: Product[]; pagination: any }>(
    '/admin/products',
    { params: filters }
  );
  return response.data;
};

/**
 * Get single product by ID (admin)
 */
export const getProduct = async (productId: number) => {
  const response = await api.get<{ success: boolean; data: Product }>(
    `/admin/products/${productId}`
  );
  return response.data.data;
};

/**
 * Create new product
 */
export const createProduct = async (data: CreateProductData) => {
  const response = await api.post<{ success: boolean; data: Product }>(
    '/admin/products',
    data
  );
  return response.data.data;
};

/**
 * Update product
 */
export const updateProduct = async (productId: number, data: UpdateProductData) => {
  const response = await api.put<{ success: boolean; data: Product }>(
    `/admin/products/${productId}`,
    data
  );
  return response.data.data;
};

/**
 * Delete product (soft delete)
 */
export const deleteProduct = async (productId: number) => {
  await api.delete(`/admin/products/${productId}`);
};

/**
 * Toggle product active status
 */
export const toggleProductStatus = async (productId: number) => {
  const response = await api.patch<{ success: boolean; data: Product }>(
    `/admin/products/${productId}/toggle-status`
  );
  return response.data.data;
};

/**
 * Upload product image
 */
export const uploadProductImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post<{ success: boolean; data: { url: string } }>(
    '/admin/products/upload-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
};

/**
 * Get products with low stock
 */
export const getLowStockProducts = async () => {
  const response = await api.get<{ success: boolean; data: Product[] }>(
    '/admin/products/low-stock'
  );
  return response.data.data;
};
