/**
 * Products Store
 * Franco Sport E-Commerce
 * 
 * Maneja el estado de productos, filtros y paginación
 */

import { create } from 'zustand';
import type { Product, ProductFilters, Pagination, Category, Brand } from '@/types';
import * as productsService from '@/api/products.service';

// ===== TYPES =====

interface ProductsState {
  // State
  products: Product[];
  selectedProduct: Product | null;
  categories: Category[];
  brands: Brand[];
  filters: ProductFilters;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setCategories: (categories: Category[]) => void;
  setBrands: (brands: Brand[]) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
  setPagination: (pagination: Pagination | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Async Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductBySlug: (slug: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchBrands: () => Promise<void>;
  loadMore: () => Promise<void>;
}

// ===== DEFAULT FILTERS =====

const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  category_id: undefined,
  brand_id: undefined,
  min_price: undefined,
  max_price: undefined,
  tags: [],
  in_stock: undefined,
  is_featured: undefined,
  sort_by: 'newest',
  page: 1,
  limit: 12,
};

// ===== STORE =====

export const useProductsStore = create<ProductsState>((set, get) => ({
  // ===== INITIAL STATE =====
  products: [],
  selectedProduct: null,
  categories: [],
  brands: [],
  filters: DEFAULT_FILTERS,
  pagination: null,
  isLoading: false,
  error: null,

  // ===== SETTERS =====
  setProducts: (products) => set({ products }),

  setSelectedProduct: (product) => set({ selectedProduct: product }),

  setCategories: (categories) => set({ categories }),

  setBrands: (brands) => set({ brands }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  setPagination: (pagination) => set({ pagination }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  // ===== FETCH PRODUCTS =====
  fetchProducts: async (filters) => {
    const { setLoading, setError, setProducts, setPagination } = get();

    try {
      setLoading(true);
      setError(null);

      const filtersToUse = filters || get().filters;

      // Llamada real al API
      const response = await productsService.getProducts(filtersToUse);

      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar productos';
      setError(message);
    } finally {
      setLoading(false);
    }
  },

  // ===== FETCH PRODUCT BY SLUG =====
  fetchProductBySlug: async (slug) => {
    const { setLoading, setError, setSelectedProduct } = get();

    try {
      setLoading(true);
      setError(null);

      // Llamada real al API
      const product = await productsService.getProductBySlug(slug);
      setSelectedProduct(product);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar producto';
      setError(message);
    } finally {
      setLoading(false);
    }
  },

  // ===== FETCH CATEGORIES =====
  fetchCategories: async () => {
    const { setCategories, setError } = get();

    try {
      setError(null);

      // Llamada real al API
      const categories = await productsService.getCategories();
      setCategories(categories);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar categorías';
      setError(message);
    }
  },

  // ===== FETCH BRANDS =====
  fetchBrands: async () => {
    const { setBrands, setError } = get();

    try {
      setError(null);

      // Llamada real al API
      const brands = await productsService.getBrands();
      setBrands(brands);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar marcas';
      setError(message);
    }
  },

  // ===== LOAD MORE =====
  loadMore: async () => {
    const { filters, pagination, fetchProducts } = get();

    if (!pagination || !pagination.has_next) {
      return;
    }

    const nextPage = pagination.page + 1;
    await fetchProducts({ ...filters, page: nextPage });
  },
}));

// ===== SELECTORS =====

export const useProducts = () => useProductsStore((state) => state.products);
export const useSelectedProduct = () => useProductsStore((state) => state.selectedProduct);
export const useCategories = () => useProductsStore((state) => state.categories);
export const useBrands = () => useProductsStore((state) => state.brands);
export const useProductFilters = () => useProductsStore((state) => state.filters);
export const useProductsPagination = () => useProductsStore((state) => state.pagination);
export const useProductsLoading = () => useProductsStore((state) => state.isLoading);
export const useProductsError = () => useProductsStore((state) => state.error);
