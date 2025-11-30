/**
 * Auth Service
 * Franco Sport E-Commerce
 * 
 * Servicio para gestión de autenticación
 */

import { api } from './axios';
import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  User 
} from '@/types';

/**
 * Register new user
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
  return response.data.data;
};

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
  return response.data.data;
};

/**
 * Get current user
 */
export const getMe = async (): Promise<User> => {
  const response = await api.get<{ success: boolean; data: User }>('/auth/me');
  return response.data.data;
};

/**
 * Logout (client-side only)
 */
export const logout = (): void => {
  // El logout es solo del lado del cliente (eliminar token)
  // El JWT se invalida automáticamente al expirar
  localStorage.removeItem('francosport_auth_token');
  localStorage.removeItem('francosport_user_data');
};
