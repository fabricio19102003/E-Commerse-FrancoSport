/**
 * Configuración general de la aplicación Franco Sport
 * Basado en variables de entorno y valores por defecto
 */

// ===== API Configuration =====
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000, // 30 segundos
} as const;

// ===== Stripe Configuration =====
export const STRIPE_CONFIG = {
  PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
} as const;

// ===== App Configuration =====
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Franco Sport',
  SLOGAN: import.meta.env.VITE_APP_SLOGAN || 'No es suerte, es esfuerzo',
  VERSION: '1.0.0',
  LOCALE: 'es-BO',
  CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
} as const;

// ===== Business Rules =====
export const BUSINESS_RULES = {
  // Envío gratis
  FREE_SHIPPING_THRESHOLD: 1000, // $1000

  // Carrito
  CART_EXPIRATION_DAYS: 30,
  MAX_ITEMS_PER_PRODUCT: 10,

  // Productos
  ITEMS_PER_PAGE: 12,
  MAX_IMAGES_PER_PRODUCT: 5,
  LOW_STOCK_THRESHOLD: 10,

  // Búsqueda
  MIN_SEARCH_LENGTH: 3,
  SEARCH_DEBOUNCE_MS: 500,

  // Reseñas
  MIN_RATING: 1,
  MAX_RATING: 5,
  MAX_REVIEW_LENGTH: 1000,

  // Contraseña
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,

  // Intentos de login
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 15,
} as const;

// ===== Pagination Defaults =====
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

// ===== Local Storage Keys =====
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'francosport_auth_token',
  USER_DATA: 'francosport_user_data',
  AUTH_STORE: 'francosport_auth_store',
  CART_STORE: 'francosport_cart_store',
  CART: 'francosport_cart',
  WISHLIST: 'francosport_wishlist',
  RECENT_SEARCHES: 'francosport_recent_searches',
  THEME: 'francosport_theme',
} as const;

// ===== Session Storage Keys =====
export const SESSION_KEYS = {
  CHECKOUT_DATA: 'francosport_checkout_data',
  TEMP_CART: 'francosport_temp_cart',
} as const;

// ===== Routes =====
export const ROUTES = {
  // Public routes
  HOME: '/',
  PRODUCTS: '/productos',
  PRODUCT_DETAIL: '/producto/:slug',
  CATEGORIES: '/categorias',
  CATEGORY: '/categoria/:slug',
  BRANDS: '/marcas',
  BRAND: '/marca/:slug',
  CART: '/carrito',
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/exito',

  // Auth routes
  LOGIN: '/login',
  REGISTER: '/registro',
  FORGOT_PASSWORD: '/recuperar-contrasena',
  RESET_PASSWORD: '/restablecer-contrasena/:token',

  // User routes (authenticated)
  PROFILE: '/perfil',
  ORDERS: '/mis-pedidos',
  ORDER_DETAIL: '/pedido/:id',
  WISHLIST: '/favoritos',
  ADDRESSES: '/direcciones',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/productos',
  ADMIN_PRODUCT_CREATE: '/admin/productos/nuevo',
  ADMIN_PRODUCT_EDIT: '/admin/productos/editar/:id',
  ADMIN_ORDERS: '/admin/pedidos',
  ADMIN_ORDER_DETAIL: '/admin/pedidos/:id',
  ADMIN_USERS: '/admin/usuarios',
  ADMIN_COUPONS: '/admin/cupones',
  ADMIN_CATEGORIES: '/admin/categorias',
  ADMIN_BRANDS: '/admin/marcas',
  ADMIN_SHIPPING: '/admin/envios',
  ADMIN_REVIEWS: '/admin/resenas',
  ADMIN_SETTINGS: '/admin/configuracion',
  ADMIN_LOGS: '/admin/logs',

  // Error routes
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/403',
  SERVER_ERROR: '/500',
} as const;

// ===== API Endpoints =====
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    ME: '/auth/me',
  },

  // Products
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:slug',
    CREATE: '/products',
    UPDATE: '/products/:id',
    DELETE: '/products/:id',
    SEARCH: '/products/search',
    FEATURED: '/products/featured',
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: '/categories/:slug',
    CREATE: '/categories',
    UPDATE: '/categories/:id',
    DELETE: '/categories/:id',
  },

  // Cart
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: '/cart/items/:id',
    REMOVE_ITEM: '/cart/items/:id',
    CLEAR: '/cart/clear',
    APPLY_COUPON: '/cart/coupon',
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    DETAIL: '/orders/:id',
    CREATE: '/orders',
    CANCEL: '/orders/:id/cancel',
    TRACK: '/orders/:id/track',
  },

  // Users
  USERS: {
    LIST: '/users',
    DETAIL: '/users/:id',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
  },

  // Reviews
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    UPDATE: '/reviews/:id',
    DELETE: '/reviews/:id',
    MODERATE: '/reviews/:id/moderate',
  },

  // Coupons
  COUPONS: {
    LIST: '/coupons',
    VALIDATE: '/coupons/validate',
    CREATE: '/coupons',
    UPDATE: '/coupons/:id',
    DELETE: '/coupons/:id',
  },
} as const;

// ===== Feature Flags =====
export const FEATURES = {
  ENABLE_WISHLIST: true,
  ENABLE_REVIEWS: true,
  ENABLE_COUPONS: true,
  ENABLE_SOCIAL_LOGIN: false, // Futuro
  ENABLE_PWA: false, // Futuro
  ENABLE_DARK_MODE: false, // Ya estamos en dark por defecto
} as const;

// ===== Validation Rules =====
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PHONE: {
    PATTERN: /^\+?[\d\s\-()]+$/,
  },
  ZIP_CODE: {
    PATTERN: /^\d{5}$/,
  },
} as const;

// ===== Environment =====
export const ENV = {
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
} as const;
