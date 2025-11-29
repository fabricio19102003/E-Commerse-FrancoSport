/**
 * Application Routes
 * Constantes de rutas para toda la aplicación
 */

export const ROUTES = {
  // ===== Public Routes =====
  HOME: '/',
  PRODUCTS: '/productos',
  PRODUCT_DETAIL: '/producto/:slug',
  CATEGORIES: '/categorias',
  CATEGORY: '/categoria/:slug',
  BRANDS: '/marcas',
  BRAND: '/marca/:slug',
  
  // ===== Cart & Checkout =====
  CART: '/carrito',
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/exito',

  // ===== Auth Routes =====
  LOGIN: '/login',
  REGISTER: '/registro',
  FORGOT_PASSWORD: '/recuperar-contrasena',
  RESET_PASSWORD: '/restablecer-contrasena/:token',

  // ===== User Routes (Authenticated) =====
  PROFILE: '/perfil',
  ORDERS: '/mis-pedidos',
  ORDER_DETAIL: '/pedido/:id',
  WISHLIST: '/favoritos',
  ADDRESSES: '/direcciones',

  // ===== Admin Routes =====
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

  // ===== Error Routes =====
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/403',
  SERVER_ERROR: '/500',
} as const;

// Helper functions para generar rutas dinámicas
export const generateRoute = {
  productDetail: (slug: string) => `/producto/${slug}`,
  category: (slug: string) => `/categoria/${slug}`,
  brand: (slug: string) => `/marca/${slug}`,
  orderDetail: (id: string) => `/pedido/${id}`,
  adminProductEdit: (id: string) => `/admin/productos/editar/${id}`,
  adminOrderDetail: (id: string) => `/admin/pedidos/${id}`,
  resetPassword: (token: string) => `/restablecer-contrasena/${token}`,
};
