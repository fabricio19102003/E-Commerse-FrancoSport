# 🏪 Zustand Store

State management global con Zustand.

## Stores:

### `authStore.ts`
- Usuario autenticado
- Token JWT
- Login/Logout
- Verificar autenticación

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
```

### `cartStore.ts`
- Items del carrito
- Total, subtotal
- Agregar/quitar/actualizar items
- Aplicar cupón
- Sincronización con backend

### `productsStore.ts`
- Lista de productos
- Filtros activos
- Búsqueda
- Productos destacados

### `uiStore.ts`
- Estado de modales
- Sidebar mobile
- Loading states
- Toast notifications

## Ventajas de Zustand:
- Simple y ligero
- No requiere providers
- TypeScript friendly
- DevTools support
- Persistencia fácil
