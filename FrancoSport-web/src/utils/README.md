# 🛠️ Utilities

Funciones de utilidad reutilizables.

## Archivos:

### `formatPrice.ts`
```typescript
// Formatear precios
formatPrice(29.99) // "$29.99"
formatPrice(1500) // "$1,500.00"
```

### `formatDate.ts`
```typescript
// Formatear fechas
formatDate(date) // "28 Nov 2024"
formatRelativeTime(date) // "hace 2 horas"
```

### `cn.ts` (classnames utility)
```typescript
// Combinar clases de Tailwind
cn('text-base', isActive && 'text-primary', className)
```

### `validation.ts`
```typescript
// Validaciones comunes
isValidEmail(email)
isValidPhone(phone)
isStrongPassword(password)
```

### `storage.ts`
```typescript
// Wrappers de localStorage/sessionStorage
setItem(key, value)
getItem(key)
removeItem(key)
```

### `slugify.ts`
```typescript
// Generar slugs
slugify('Camiseta Deportiva') // "camiseta-deportiva"
```

### `calculateDiscount.ts`
```typescript
// Calcular descuentos
calculateDiscount(price, comparePrice) // 25 (porcentaje)
```

### `api-error-handler.ts`
```typescript
// Manejo centralizado de errores de API
handleApiError(error)
```

## Principios:
- Funciones puras
- TypeScript strict
- Unit testeable
- Sin side effects
