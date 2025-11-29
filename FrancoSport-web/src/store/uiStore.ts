/**
 * UI Store
 * Franco Sport E-Commerce
 * 
 * Maneja el estado de la interfaz de usuario
 */

import { create } from 'zustand';

// ===== TYPES =====

export type Theme = 'dark' | 'light';
export type ViewMode = 'grid' | 'list';

interface UIState {
  // State
  isMobileMenuOpen: boolean;
  isCartDrawerOpen: boolean;
  isSearchModalOpen: boolean;
  isFiltersOpen: boolean;
  theme: Theme;
  viewMode: ViewMode;
  
  // Modal Management
  activeModal: string | null;
  modalData: any;

  // Actions
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openMobileMenu: () => void;

  toggleCartDrawer: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;

  toggleSearchModal: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;

  toggleFilters: () => void;
  openFilters: () => void;
  closeFilters: () => void;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;

  // Generic Modal Management
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;

  // Close all overlays
  closeAll: () => void;
}

// ===== STORE =====

export const useUIStore = create<UIState>((set) => ({
  // ===== INITIAL STATE =====
  isMobileMenuOpen: false,
  isCartDrawerOpen: false,
  isSearchModalOpen: false,
  isFiltersOpen: false,
  theme: 'dark', // Default dark theme
  viewMode: 'grid', // Default grid view
  activeModal: null,
  modalData: null,

  // ===== MOBILE MENU =====
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  openMobileMenu: () => set({ isMobileMenuOpen: true }),

  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  // ===== CART DRAWER =====
  toggleCartDrawer: () =>
    set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

  openCartDrawer: () => set({ isCartDrawerOpen: true }),

  closeCartDrawer: () => set({ isCartDrawerOpen: false }),

  // ===== SEARCH MODAL =====
  toggleSearchModal: () =>
    set((state) => ({ isSearchModalOpen: !state.isSearchModalOpen })),

  openSearchModal: () => set({ isSearchModalOpen: true }),

  closeSearchModal: () => set({ isSearchModalOpen: false }),

  // ===== FILTERS =====
  toggleFilters: () =>
    set((state) => ({ isFiltersOpen: !state.isFiltersOpen })),

  openFilters: () => set({ isFiltersOpen: true }),

  closeFilters: () => set({ isFiltersOpen: false }),

  // ===== THEME =====
  setTheme: (theme) => {
    set({ theme });
    // Aplicar theme al documento (si quieres soporte para light mode en el futuro)
    document.documentElement.classList.toggle('light', theme === 'light');
  },

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('light', newTheme === 'light');
      return { theme: newTheme };
    }),

  // ===== VIEW MODE =====
  setViewMode: (mode) => set({ viewMode: mode }),

  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === 'grid' ? 'list' : 'grid',
    })),

  // ===== GENERIC MODAL =====
  openModal: (modalId, data) =>
    set({
      activeModal: modalId,
      modalData: data,
    }),

  closeModal: () =>
    set({
      activeModal: null,
      modalData: null,
    }),

  // ===== CLOSE ALL =====
  closeAll: () =>
    set({
      isMobileMenuOpen: false,
      isCartDrawerOpen: false,
      isSearchModalOpen: false,
      isFiltersOpen: false,
      activeModal: null,
      modalData: null,
    }),
}));

// ===== SELECTORS =====

export const useIsMobileMenuOpen = () => useUIStore((state) => state.isMobileMenuOpen);
export const useIsCartDrawerOpen = () => useUIStore((state) => state.isCartDrawerOpen);
export const useIsSearchModalOpen = () => useUIStore((state) => state.isSearchModalOpen);
export const useIsFiltersOpen = () => useUIStore((state) => state.isFiltersOpen);
export const useTheme = () => useUIStore((state) => state.theme);
export const useViewMode = () => useUIStore((state) => state.viewMode);
export const useActiveModal = () => useUIStore((state) => state.activeModal);
export const useModalData = () => useUIStore((state) => state.modalData);
