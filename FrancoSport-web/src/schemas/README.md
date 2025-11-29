# 🔒 Zod Schemas

Esquemas de validación con Zod para formularios y datos.

## Archivos:

### `auth.schemas.ts`
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener una mayúscula')
    .regex(/[a-z]/, 'Debe contener una minúscula')
    .regex(/[0-9]/, 'Debe contener un número'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
```

### `product.schemas.ts`
```typescript
export const productFormSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().min(10),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  sku: z.string().min(3),
  // ... más campos
});
```

### `checkout.schemas.ts`
```typescript
export const shippingAddressSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  address: z.string().min(10),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().regex(/^\d{5}$/),
  country: z.string().min(2),
  phone: z.string().regex(/^\+?[\d\s-()]+$/),
});
```

## Uso con React Hook Form:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: '',
    password: '',
  }
});
```

## Ventajas:
- Validación type-safe
- Mensajes de error personalizados
- Reutilizable en frontend y backend
- Inferencia de tipos automática
