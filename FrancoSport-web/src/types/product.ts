/**
 * Product Types
 * Franco Sport E-Commerce
 */

// ===== PRODUCT INTERFACES =====

export interface Product {
  id: number;
  name: string;
  slug: string;
  short_description?: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku: string;
  barcode?: string;
  stock: number;
  low_stock_threshold: number;
  weight: number;
  category_id: number;
  category?: Category;
  brand_id: number;
  brand?: Brand;
  is_featured: boolean;
  is_active: boolean;
  images: ProductImage[];
  variants?: ProductVariant[];
  tags?: Tag[];
  avg_rating?: number;
  reviews_count?: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  sku: string;
  price?: number;
  stock: number;
  attributes: Record<string, string>; // JSON: { size: 'M', color: 'Red' }
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===== CATEGORY INTERFACES =====

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  parent?: Category;
  children?: Category[];
  display_order: number;
  is_active: boolean;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

// ===== BRAND INTERFACES =====

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  is_active: boolean;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

// ===== TAG INTERFACES =====

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

// ===== REVIEW INTERFACES =====

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  rating: number; // 1-5
  title?: string;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewInput {
  product_id: number;
  rating: number;
  title?: string;
  comment: string;
}

// ===== PRODUCT FILTERS =====

export interface ProductFilters {
  search?: string;
  category_id?: number;
  brand_id?: number;
  min_price?: number;
  max_price?: number;
  tags?: string[];
  in_stock?: boolean;
  is_featured?: boolean;
  sort_by?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'popularity' | 'rating';
  page?: number;
  limit?: number;
}

// ===== PRODUCT LIST RESPONSE =====

export interface ProductListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ===== CREATE/UPDATE PRODUCT (ADMIN) =====

export interface CreateProductInput {
  name: string;
  short_description?: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_price: number;
  sku: string;
  barcode?: string;
  stock: number;
  low_stock_threshold?: number;
  weight: number;
  category_id: number;
  brand_id: number;
  is_featured?: boolean;
  is_active?: boolean;
  meta_title?: string;
  meta_description?: string;
  tags?: number[]; // Array of tag IDs
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: number;
}
