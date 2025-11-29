# 📐 TypeScript Types

Definiciones de tipos e interfaces TypeScript.

## Archivos:

### `user.types.ts`
```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'CUSTOMER' | 'MODERATOR';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}
```

### `product.types.ts`
```typescript
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  images: ProductImage[];
  category: Category;
  brand: Brand;
  variants?: ProductVariant[];
  rating: number;
  reviewCount: number;
}
```

### `cart.types.ts`
```typescript
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  priceAtAdd: number;
  product: Product;
}
```

### `order.types.ts`
```typescript
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  shippingAddress: Address;
  total: number;
  createdAt: string;
}
```

### `api.types.ts`
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### `form.types.ts`
```typescript
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}
```

## Organización:
- Un archivo por dominio
- Exports nombrados
- Documentación con JSDoc cuando sea necesario
- Enums para valores fijos
