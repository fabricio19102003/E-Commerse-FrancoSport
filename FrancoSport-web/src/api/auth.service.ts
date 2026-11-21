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
 * Verify email with the token from the emailed link
 */
export const verifyEmail = async (token: string): Promise<void> => {
  await api.post('/auth/verify-email', { token });
};

/**
 * Send a new verification email to the logged-in user
 */
export const resendVerification = async (): Promise<string> => {
  const response = await api.post<{ success: boolean; message: string }>('/auth/resend-verification');
  return response.data.message;
};

/**
 * Request the password reset email (the API answers the same for any email)
 */
export const forgotPassword = async (email: string): Promise<void> => {
  await api.post('/auth/forgot-password', { email });
};

/**
 * Set a new password with the token from the emailed link
 */
export const resetPassword = async (token: string, password: string): Promise<void> => {
  await api.post('/auth/reset-password', { token, password });
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
