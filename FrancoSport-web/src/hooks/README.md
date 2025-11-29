# 🪝 Custom Hooks

Hooks reutilizables para lógica compartida.

## Hooks disponibles:

### `useAuth.ts`
```typescript
// Acceso al estado de autenticación
const { user, isAuthenticated, login, logout } = useAuth();
```

### `useCart.ts`
```typescript
// Gestión del carrito
const { items, total, addItem, removeItem, updateQuantity } = useCart();
```

### `useProducts.ts`
```typescript
// Productos con filtros
const { products, isLoading, filters, setFilters } = useProducts();
```

### `useDebounce.ts`
```typescript
// Debounce para búsquedas
const debouncedValue = useDebounce(searchTerm, 500);
```

### `useLocalStorage.ts`
```typescript
// Persistencia en localStorage
const [value, setValue] = useLocalStorage('key', defaultValue);
```

### `useMediaQuery.ts`
```typescript
// Responsive breakpoints
const isMobile = useMediaQuery('(max-width: 768px)');
```

### `useIntersectionObserver.ts`
```typescript
// Lazy loading, infinite scroll
const { ref, isIntersecting } = useIntersectionObserver();
```

### `useToast.ts`
```typescript
// Notificaciones
const { toast } = useToast();
toast.success('Producto agregado al carrito');
```

## Principios:
- Reutilización de lógica
- Separación de concerns
- TypeScript types
- Testing friendly
