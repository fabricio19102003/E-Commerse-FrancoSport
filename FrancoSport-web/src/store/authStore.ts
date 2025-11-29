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
  
  // Auth Actions (estas llamarán al API service cuando lo implementemos)
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

          // TODO: Reemplazar con llamada real al API cuando esté el service
          // Simulación temporal
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Simulación de respuesta
          if (credentials.email === 'admin@franco.com' && credentials.password === '1234') {
            const mockResponse: AuthResponse = {
              token: 'mock-jwt-token-admin',
              user: {
                id: 1,
                email: 'admin@franco.com',
                first_name: 'Pedro',
                last_name: 'Admin',
                role: 'ADMIN',
                email_verified: true,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            };

            setToken(mockResponse.token);
            setUser(mockResponse.user);
          } else if (credentials.email === 'user@franco.com' && credentials.password === '1234') {
            const mockResponse: AuthResponse = {
              token: 'mock-jwt-token-user',
              user: {
                id: 2,
                email: 'user@franco.com',
                first_name: 'Cliente',
                last_name: 'Fiel',
                role: 'CUSTOMER',
                email_verified: true,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            };

            setToken(mockResponse.token);
            setUser(mockResponse.user);
          } else {
            throw new Error('Credenciales inválidas');
          }
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

          // TODO: Reemplazar con llamada real al API cuando esté el service
          // Simulación temporal
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Simulación de respuesta
          const mockResponse: AuthResponse = {
            token: 'mock-jwt-token-new-user',
            user: {
              id: Date.now(),
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              phone: data.phone,
              role: 'CUSTOMER',
              email_verified: false,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          };

          setToken(mockResponse.token);
          setUser(mockResponse.user);
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
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);

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
      name: STORAGE_KEYS.AUTH_STORE, // Key en localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }), // Solo persistir estos campos
    }
  )
);

// ===== SELECTORS (Helpers para componentes) =====

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN');
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
