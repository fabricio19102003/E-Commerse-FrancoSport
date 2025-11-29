/**
 * Form Types
 * Franco Sport E-Commerce
 * Para uso con React Hook Form
 */

// ===== AUTH FORMS =====

export interface LoginFormData {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirm_password: string;
}

// ===== USER FORMS =====

export interface UpdateProfileFormData {
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface ChangePasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ===== ADDRESS FORMS =====

export interface AddressFormData {
  address_type: 'SHIPPING' | 'BILLING';
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

// ===== CHECKOUT FORMS =====

export interface CheckoutFormData {
  // Step 1: Contact
  email?: string;
  
  // Step 2: Shipping Address
  shipping_address_id?: number;
  new_shipping_address?: AddressFormData;
  
  // Step 3: Shipping Method
  shipping_method_id?: number;
  
  // Step 4: Payment & Review
  coupon_code?: string;
  notes?: string;
  accept_terms: boolean;
}

// ===== REVIEW FORMS =====

export interface ReviewFormData {
  rating: number;
  title?: string;
  comment: string;
}

// ===== CONTACT FORM =====

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ===== SEARCH FORM =====

export interface SearchFormData {
  query: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
}
