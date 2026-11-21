# 🏃 Franco Sport - Frontend

> **"No es suerte, es esfuerzo"**

E-commerce profesional de ropa deportiva construido con React 19, TypeScript, Vite y Tailwind CSS.

---

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ 
- npm 9+

### Instalación

**Opción 1: Script automático (Windows PowerShell)**
```powershell
.\install.ps1
```

**Opción 2: Manual**
```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

El proyecto estará disponible en [http://localhost:5173](http://localhost:5173)

---

## 📦 Stack Tecnológico

### Core
- **React 19.2.0** - Framework UI
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool ultra-rápido

### State Management
- **Zustand 5.0.2** - State management simple y eficiente

### Routing
- **React Router 6.28.0** - Routing declarativo

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **PostCSS + Autoprefixer** - CSS processing

### Forms & Validation
- **React Hook Form 7.54.2** - Form management performante
- **Zod 3.24.1** - Schema validation

### HTTP Client
- **Axios 1.7.9** - HTTP requests con interceptors

### Pagos
- QR, transferencia bancaria y pago contra entrega (la tienda confirma el pago)

### UI Components
- **Lucide React 0.468.0** - Iconos modernos
- **React Hot Toast 2.4.1** - Notificaciones elegantes

### Utilities
- **date-fns 4.1.0** - Manejo de fechas
- **clsx + tailwind-merge** - Class management

---

## 📁 Estructura del Proyecto

```
src/
├── api/              # Servicios de API
├── components/       # Componentes React
│   ├── ui/          # Componentes base
│   ├── layout/      # Layouts
│   ├── products/    # Productos
│   ├── cart/        # Carrito
│   ├── checkout/    # Checkout
│   ├── auth/        # Autenticación
│   └── admin/       # Admin
├── pages/           # Páginas
│   └── admin/       # Páginas admin
├── store/           # Zustand stores
├── hooks/           # Custom hooks
├── types/           # TypeScript types
├── schemas/         # Zod schemas
├── utils/           # Utilidades
├── constants/       # Constantes
└── assets/          # Assets estáticos
```

Ver [ESTRUCTURA.md](./ESTRUCTURA.md) para detalles completos.

---

## 🎨 Sistema de Diseño

Basado en un sistema Dark Mode premium:

### Colores

```css
Primary:    #10B981 (Verde vibrante)
Background: #0A0A0A (Negro profundo)
Surface:    #1A1A1A (Gris oscuro)
Text:       #FFFFFF / #A3A3A3
```

### Tipografía

- Font Family: **Inter**
- Responsive sizes via Tailwind

### Breakpoints

- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (puerto 5173)

# Build
npm run build            # Build para producción

# Preview
npm run preview          # Preview del build

# Quality
npm run type-check       # Verificar tipos TypeScript
npm run lint             # Linting con ESLint
```

---

## 🔐 Variables de Entorno

Copia `.env.example` a `.env` y configura:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Franco Sport
VITE_APP_SLOGAN=No es suerte, es esfuerzo
```

---

## 📚 Características Principales

### MVP (Fase 1)
- ✅ Estructura completa del proyecto
- ✅ Sistema de diseño implementado
- ⏳ Autenticación (Login, Registro, Recuperación)
- ⏳ Catálogo de productos con filtros y búsqueda
- ⏳ Carrito de compras persistente
- ⏳ Checkout completo (QR, transferencia, contra entrega, cupones)
- ⏳ Gestión de pedidos
- ⏳ Panel administrativo completo
- ⏳ Sistema de reseñas
- ⏳ Wishlist

### Futuras Mejoras
- Notificaciones push
- PWA (Progressive Web App)
- Internacionalización (i18n)
- Chat en vivo
- Sistema de puntos/recompensas

---

## 🔧 Configuraciones

### Path Aliases

Usa `@/` para importar desde `src/`:

```typescript
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import type { Product } from '@/types/product.types'
```

### API Proxy

El servidor de desarrollo tiene un proxy configurado:

```
/api → http://localhost:3000
```

---

## 📖 Documentación

- [Estructura del Proyecto](./ESTRUCTURA.md)
- [Guía de Instalación](./INSTALACION.md)
- [Árbol de Directorios](./TREE.txt)
- Cada carpeta en `/src` tiene su propio README

---

## 🎯 Roadmap

### Sprint 1 - Fundación (2 semanas)
- [x] Setup del proyecto
- [x] Sistema de diseño
- [ ] Autenticación básica
- [ ] Listado de productos

### Sprint 2 - Catálogo (2 semanas)
- [ ] Detalle de producto
- [ ] Búsqueda y filtrado
- [ ] Carrito de compras

### Sprint 3 - Ventas (3 semanas)
- [ ] Proceso de checkout
- [ ] Confirmación de pagos (QR, transferencia, contra entrega)
- [ ] Gestión de pedidos

### Sprint 4 - Admin (2 semanas)
- [ ] Panel administrativo
- [ ] CRUD de productos
- [ ] Gestión de pedidos

### Sprint 5 - Refinamiento (1-2 semanas)
- [ ] Reseñas
- [ ] Wishlist
- [ ] Optimizaciones

---

## 🤝 Contribución

Este es un proyecto personal de aprendizaje. Si tienes sugerencias:

1. Crea un issue
2. Propón mejoras
3. Comparte feedback

---

## 📝 Convenciones de Código

### Nombres de Archivos
- Componentes: `PascalCase.tsx`
- Hooks: `camelCase.ts` con prefijo `use`
- Utilities: `camelCase.ts`
- Types: `camelCase.types.ts`
- Constants: `kebab-case.ts`

### Imports
```typescript
// 1. Libraries
import React from 'react'
// 2. Internal
import { useAuth } from '@/hooks/useAuth'
// 3. Components
import { Button } from '@/components/ui/Button'
// 4. Types
import type { User } from '@/types/user.types'
// 5. Styles
import './styles.css'
```

---

## 🐛 Troubleshooting

### Tailwind classes no se aplican
1. Verifica que `index.css` tiene `@tailwind` directives
2. Reinicia el servidor de desarrollo
3. Limpia caché: `npm run dev -- --force`

### Error de tipos TypeScript
```bash
npm run type-check
```

### Path alias no funciona
1. Verifica `vite.config.ts`
2. Verifica `tsconfig.app.json`
3. Reinicia VSCode

---

## 📄 Licencia

Este proyecto es privado y con fines educativos.

---

## 👨‍💻 Autor

**Pedro Fabricio**

---

## 🙏 Agradecimientos

Basado en las mejores prácticas de:
- React Docs
- Tailwind CSS
- TypeScript
- Y la comunidad de desarrollo web

---

<p align="center">
  <strong>"No es suerte, es esfuerzo"</strong>
  <br>
  Franco Sport © 2024
</p>
