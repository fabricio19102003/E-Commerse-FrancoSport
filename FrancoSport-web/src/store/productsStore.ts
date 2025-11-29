/**
 * Products Store
 * Franco Sport E-Commerce
 * 
 * Maneja el estado de productos, filtros y paginación
 */

import { create } from 'zustand';
import type { Product, ProductFilters, Pagination, Category, Brand } from '@/types';

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

  // Async Actions (cuando se implemente el API service)
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
      filters: { ...state.filters, ...newFilters, page: 1 }, // Reset page cuando cambian filtros
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

      // Usar los filtros proporcionados o los del estado
      const filtersToUse = filters || get().filters;

      // TODO: Reemplazar con llamada real al API cuando esté el service
      // Simulación temporal con datos mock
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Edición Limitada Carbono',
          slug: 'edicion-limitada-carbono',
          description: 'Diseño aerodinámico en escala de grises. No es suerte, es esfuerzo.',
          short_description: 'Diseño aerodinámico premium',
          price: 180,
          compare_at_price: 220,
          sku: 'ELC-001',
          stock: 15,
          low_stock_threshold: 10,
          weight: 0.5,
          category_id: 1,
          brand_id: 1,
          is_featured: true,
          is_active: true,
          images: [
            {
              id: 1,
              product_id: 1,
              url: 'https://images.unsplash.com/photo-1577212017184-80cc3c0bcb85?auto=format&fit=crop&q=80&w=800',
              is_primary: true,
              display_order: 1,
              created_at: new Date().toISOString(),
            },
          ],
          avg_rating: 4.8,
          reviews_count: 24,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Red Racing Beast',
          slug: 'red-racing-beast',
          description: 'Geometría agresiva para dominar la pista. Tonos rojos vibrantes.',
          short_description: 'Geometría agresiva',
          price: 165,
          sku: 'RRB-002',
          stock: 8,
          low_stock_threshold: 10,
          weight: 0.5,
          category_id: 1,
          brand_id: 2,
          is_featured: true,
          is_active: true,
          images: [
            {
              id: 2,
              product_id: 2,
              url: 'https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&q=80&w=800',
              is_primary: true,
              display_order: 1,
              created_at: new Date().toISOString(),
            },
          ],
          avg_rating: 4.6,
          reviews_count: 18,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: 'White Cross Series',
          slug: 'white-cross-series',
          description: 'Elegancia y rendimiento. Detalles en negro y rojo sobre base blanca.',
          short_description: 'Elegancia y rendimiento',
          price: 150,
          sku: 'WCS-003',
          stock: 12,
          low_stock_threshold: 10,
          weight: 0.5,
          category_id: 2,
          brand_id: 1,
          is_featured: false,
          is_active: true,
          images: [
            {
              id: 3,
              product_id: 3,
              url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800',
              is_primary: true,
              display_order: 1,
              created_at: new Date().toISOString(),
            },
          ],
          avg_rating: 4.5,
          reviews_count: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 4,
          name: 'Polo Promo 86',
          slug: 'polo-promo-86',
          description: 'Vivir, estudiar, triunfar. La elegancia del legado.',
          short_description: 'La elegancia del legado',
          price: 120,
          sku: 'PP86-004',
          stock: 25,
          low_stock_threshold: 10,
          weight: 0.3,
          category_id: 3,
          brand_id: 3,
          is_featured: false,
          is_active: true,
          images: [
            {
              id: 4,
              product_id: 4,
              url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=800',
              is_primary: true,
              display_order: 1,
              created_at: new Date().toISOString(),
            },
          ],
          avg_rating: 4.7,
          reviews_count: 32,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockPagination: Pagination = {
        page: filtersToUse.page || 1,
        limit: filtersToUse.limit || 12,
        total: mockProducts.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      };

      setProducts(mockProducts);
      setPagination(mockPagination);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar productos';
      setError(message);
    } finally {
      setLoading(false);
    }
  },

  // ===== FETCH PRODUCT BY SLUG =====
  fetchProductBySlug: async (slug) => {
    const { setLoading, setError, setSelectedProduct, products } = get();

    try {
      setLoading(true);
      setError(null);

      // TODO: Reemplazar con llamada real al API
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Buscar en productos ya cargados primero
      const product = products.find((p) => p.slug === slug);
      if (product) {
        setSelectedProduct(product);
      } else {
        throw new Error('Producto no encontrado');
      }
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

      // TODO: Reemplazar con llamada real al API
      await new Promise((resolve) => setTimeout(resolve, 300));

      const mockCategories: Category[] = [
        {
          id: 1,
          name: 'Elite',
          slug: 'elite',
          display_order: 1,
          is_active: true,
          products_count: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Pro',
          slug: 'pro',
          display_order: 2,
          is_active: true,
          products_count: 28,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: 'Sport',
          slug: 'sport',
          display_order: 3,
          is_active: true,
          products_count: 42,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setCategories(mockCategories);
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

      // TODO: Reemplazar con llamada real al API
      await new Promise((resolve) => setTimeout(resolve, 300));

      const mockBrands: Brand[] = [
        {
          id: 1,
          name: 'Franco Sport',
          slug: 'franco-sport',
          is_active: true,
          products_count: 45,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Racing Elite',
          slug: 'racing-elite',
          is_active: true,
          products_count: 32,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: 'Legacy',
          slug: 'legacy',
          is_active: true,
          products_count: 18,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setBrands(mockBrands);
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
