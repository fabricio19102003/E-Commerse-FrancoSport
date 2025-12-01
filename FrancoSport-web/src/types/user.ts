/**
 * User Types
 * Franco Sport E-Commerce
 */

// ===== "ENUM" COMO OBJETO =====

export const UserRole = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  MODERATOR: 'MODERATOR',
} as const;

// Tipo union de los valores del objeto
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ===== USER INTERFACES =====

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  loyalty_points: number;
  email_verified: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  addresses: Address[];
  orders_count: number;
}

// ===== ADDRESS INTERFACES =====

export interface Address {
  id: number;
  user_id: number;
  address_type: 'SHIPPING' | 'BILLING';
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  address_type: 'SHIPPING' | 'BILLING';
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default?: boolean;
}

// ===== AUTH INTERFACES =====

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirm_password: string;
}

// ===== UPDATE USER INTERFACES =====

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}
