# 🏗️ Estructura del Proyecto Frontend - Franco Sport

**Versión:** 1.0.0  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS  
**Estado:** Estructura Base Creada

---

## 📂 Estructura Completa

```
src/
├── api/                    # 🌐 Servicios de comunicación con backend
│   ├── axios.ts           # Configuración base de axios
│   ├── auth.ts            # Servicios de autenticación
│   ├── products.ts        # Servicios de productos
│   ├── cart.ts            # Servicios de carrito
│   ├── orders.ts          # Servicios de pedidos
│   ├── admin.ts           # Servicios administrativos
│   └── README.md          # Documentación de API services
│
├── components/            # 🧩 Componentes React
│   ├── ui/               # Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   └── README.md
│   │
│   ├── layout/           # Componentes de layout
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MainLayout.tsx
│   │   ├── AdminLayout.tsx
│   │   └── README.md
│   │
│   ├── products/         # Componentes de productos
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── ProductFilters.tsx
│   │   └── README.md
│   │
│   ├── cart/             # Componentes de carrito
│   │   ├── CartIcon.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   └── README.md
│   │
│   ├── checkout/         # Componentes de checkout
│   │   ├── CheckoutSteps.tsx
│   │   ├── ShippingForm.tsx
│   │   ├── PaymentForm.tsx
│   │   └── README.md
│   │
│   ├── auth/             # Componentes de autenticación
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── README.md
│   │
│   └── admin/            # Componentes de admin
│       ├── Dashboard.tsx
│       ├── ProductsTable.tsx
│       ├── OrdersTable.tsx
│       └── README.md
│
├── pages/                # 📄 Páginas de la aplicación
│   ├── Home.tsx
│   ├── Products.tsx
│   ├── ProductDetail.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Profile.tsx
│   ├── Orders.tsx
│   ├── OrderDetail.tsx
│   ├── Wishlist.tsx
│   ├── NotFound.tsx
│   ├── README.md
│   │
│   └── admin/            # Páginas administrativas
│       ├── AdminDashboard.tsx
│       ├── AdminProducts.tsx
│       ├── AdminOrders.tsx
│       ├── AdminUsers.tsx
│       └── README.md
│
├── store/                # 🏪 Zustand State Management
│   ├── authStore.ts      # Estado de autenticación
│   ├── cartStore.ts      # Estado del carrito
│   ├── productsStore.ts  # Estado de productos
│   ├── uiStore.ts        # Estado de UI (modales, etc.)
│   └── README.md
│
├── hooks/                # 🪝 Custom Hooks
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useProducts.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   └── README.md
│
├── types/                # 📐 TypeScript Types
│   ├── user.types.ts
│   ├── product.types.ts
│   ├── cart.types.ts
│   ├── order.types.ts
│   ├── api.types.ts
│   ├── form.types.ts
│   └── README.md
│
├── schemas/              # 🔒 Zod Validation Schemas
│   ├── auth.schemas.ts
│   ├── product.schemas.ts
│   ├── checkout.schemas.ts
│   └── README.md
│
├── utils/                # 🛠️ Utilities
│   ├── formatPrice.ts
│   ├── formatDate.ts
│   ├── cn.ts            # classnames utility
│   ├── validation.ts
│   ├── storage.ts
│   └── README.md
│
├── constants/            # 📋 Constants
│   ├── routes.ts
│   ├── config.ts
│   ├── order-status.ts
│   └── README.md
│
├── assets/               # 🖼️ Assets estáticos
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── App.tsx               # Componente principal
├── main.tsx              # Entry point
└── index.css             # Estilos globales
```

---

## 🎯 Principios de Organización

### 1. **Separación por Dominio**
Cada carpeta agrupa funcionalidad relacionada (products, cart, auth, etc.)

### 2. **Componentes Reutilizables**
- `ui/` - Componentes base sin lógica de negocio
- Componentes específicos en sus carpetas de dominio

### 3. **Colocation**
Mantener archivos relacionados cerca (componente, tipos, estilos)

### 4. **Single Responsibility**
Cada archivo/componente tiene una sola responsabilidad

### 5. **TypeScript First**
- Tipos explícitos en `/types`
- Validación con Zod en `/schemas`
- Props con interfaces bien definidas

---

## 📦 Próximos Pasos

1. ✅ **Estructura de carpetas creada**
2. ⏳ Instalar dependencias necesarias
3. ⏳ Configurar Tailwind CSS
4. ⏳ Configurar React Router
5. ⏳ Configurar Zustand stores
6. ⏳ Crear componentes UI base
7. ⏳ Configurar axios con interceptors
8. ⏳ Crear tipos TypeScript base
9. ⏳ Crear schemas de validación
10. ⏳ Implementar sistema de rutas

---

## 🔧 Convenciones de Código

### Nombres de Archivos
- Componentes: `PascalCase.tsx` (ej: `ProductCard.tsx`)
- Hooks: `camelCase.ts` con prefijo `use` (ej: `useAuth.ts`)
- Utilities: `camelCase.ts` (ej: `formatPrice.ts`)
- Types: `camelCase.types.ts` (ej: `user.types.ts`)
- Constants: `kebab-case.ts` (ej: `order-status.ts`)

### Nombres de Componentes
```typescript
// ✅ Correcto
export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return <div>...</div>;
};

// ❌ Incorrecto
export default function productCard(props) {
  return <div>...</div>;
}
```

### Imports
```typescript
// Orden de imports
import React from 'react'; // 1. Libraries
import { useAuth } from '@/hooks/useAuth'; // 2. Internal hooks/utils
import { Button } from '@/components/ui/Button'; // 3. Components
import type { Product } from '@/types/product.types'; // 4. Types
import './styles.css'; // 5. Styles
```

### Props
```typescript
// Siempre definir interface para props
interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  className,
}) => {
  // ...
};
```

---

## 📚 Documentación de Cada Módulo

Cada carpeta principal contiene un `README.md` explicando:
- Propósito del módulo
- Archivos principales
- Ejemplos de uso
- Principios y patrones

**Lee los README de cada carpeta antes de trabajar en ese módulo.**

---

## 🚀 Comandos Útiles (Futuros)

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

---

## 🎨 Sistema de Diseño

Basado en el documento de requerimientos (RI-001):

**Colores:**
- Primary: `#10B981` (Verde vibrante)
- Background: `#0A0A0A` (Negro profundo)
- Surface: `#1A1A1A` (Gris oscuro)
- Text Primary: `#FFFFFF`
- Text Secondary: `#A3A3A3`

**Tipografía:**
- Font Family: Inter
- Responsive sizes via Tailwind

**Breakpoints:**
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

---

## ✨ Features Planeadas

### MVP (Sprint 1-4)
- ✅ Estructura de proyecto
- ⏳ Autenticación completa
- ⏳ Catálogo de productos
- ⏳ Carrito de compras
- ⏳ Checkout con Stripe
- ⏳ Panel administrativo
- ⏳ Gestión de pedidos

### Futuras Mejoras
- Dark/Light mode toggle
- Internacionalización (i18n)
- PWA (Progressive Web App)
- Notificaciones push
- Chat en vivo
- Tests (Jest + React Testing Library)

---

**Creado por:** Pedro Fabricio  
**Fecha:** 28 de Noviembre, 2024  
**Lema:** "No es suerte, es esfuerzo" - Franco Sport

---
