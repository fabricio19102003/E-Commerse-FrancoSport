/**
 * Auth Store
 * Franco Sport E-Commerce
 * 
 * Maneja el estado de autenticación del usuario
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';
import { STORAGE_KEYS } from '@/constants/config';
import * as authService from '@/api/auth.service';

// ===== TYPES =====

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Auth Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

// ===== STORE =====

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ===== INITIAL STATE =====
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ===== SETTERS =====
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        } else {
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        }
        set({ token });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // ===== LOGIN =====
      login: async (credentials) => {
        const { setLoading, setError, setUser, setToken } = get();

        try {
          setLoading(true);
          setError(null);

          // Llamada real al API
          const response: AuthResponse = await authService.login(credentials);

          // Guardar token y usuario
          setToken(response.token);
          setUser(response.user);

          // Guardar en localStorage adicional para persistencia
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // ===== REGISTER =====
      register: async (data) => {
        const { setLoading, setError, setUser, setToken } = get();

        try {
          setLoading(true);
          setError(null);

          // Llamada real al API
          const response: AuthResponse = await authService.register(data);

          // Guardar token y usuario
          setToken(response.token);
          setUser(response.user);

          // Guardar en localStorage adicional
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al registrarse';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // ===== LOGOUT =====
      logout: () => {
        // Limpiar localStorage
        authService.logout();

        // Resetear state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // ===== UPDATE USER =====
      updateUser: (userData) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser });
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
        }
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_STORE,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ===== SELECTORS =====

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN');
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
