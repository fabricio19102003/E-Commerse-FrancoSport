# 📋 Constants

Constantes y configuraciones de la aplicación.

## Archivos:

### `routes.ts`
```typescript
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/productos',
  PRODUCT_DETAIL: '/producto/:slug',
  CART: '/carrito',
  CHECKOUT: '/checkout',
  LOGIN: '/login',
  REGISTER: '/registro',
  PROFILE: '/perfil',
  ORDERS: '/mis-pedidos',
  ORDER_DETAIL: '/pedido/:id',
  WISHLIST: '/favoritos',
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/productos',
  ADMIN_ORDERS: '/admin/pedidos',
  ADMIN_USERS: '/admin/usuarios',
  ADMIN_COUPONS: '/admin/cupones',
  // ...
} as const;
```

### `config.ts`
```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export const APP_CONFIG = {
  name: 'Franco Sport',
  slogan: 'No es suerte, es esfuerzo',
  currency: 'USD',
  locale: 'es-BO',
  freeShippingThreshold: 1000,
  cartExpirationDays: 30,
  itemsPerPage: 12,
  maxImagesPerProduct: 5,
} as const;
```

### `order-status.ts`
```typescript
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  PAID: 'Pagado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'yellow',
  PROCESSING: 'blue',
  PAID: 'green',
  SHIPPED: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'red',
};
```

### `validation-rules.ts`
```typescript
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
  ZIP_CODE_REGEX: /^\d{5}$/,
} as const;
```

## Principios:
- `as const` para tipos literales
- UPPER_CASE para constantes
- Agrupación lógica
- Fácil mantenimiento
