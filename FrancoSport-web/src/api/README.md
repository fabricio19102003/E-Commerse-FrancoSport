# 🌐 API Services

Este directorio contiene todos los servicios de comunicación con el backend.

## Archivos principales:
- `axios.ts` - Configuración base de axios con interceptors
- `auth.ts` - Servicios de autenticación (login, registro, logout)
- `products.ts` - Servicios de productos (CRUD, búsqueda, filtrado)
- `cart.ts` - Servicios del carrito de compras
- `orders.ts` - Servicios de pedidos
- `admin.ts` - Servicios administrativos
- `categories.ts` - Servicios de categorías
- `brands.ts` - Servicios de marcas
- `coupons.ts` - Servicios de cupones
- `reviews.ts` - Servicios de reseñas
- `shipping.ts` - Servicios de envíos
- `users.ts` - Servicios de usuarios

## Estructura de respuesta:
```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}
```
