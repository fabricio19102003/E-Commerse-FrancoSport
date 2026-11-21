# 📦 Guía de Instalación - Franco Sport Frontend

## 🚀 Instalación de Dependencias

### Paso 1: Instalar todas las dependencias

```bash
npm install
```

### Paso 2: Verificar la instalación

```bash
npm run type-check
```

## 📦 Dependencias Instaladas

### Core Dependencies (Production)
- ✅ `react@19.2.0` - Framework UI
- ✅ `react-dom@19.2.0` - React DOM renderer
- ✅ `react-router-dom@6.28.0` - Routing
- ✅ `zustand@5.0.2` - State management
- ✅ `axios@1.7.9` - HTTP client
- ✅ `react-hook-form@7.54.2` - Form management
- ✅ `zod@3.24.1` - Schema validation
- ✅ `@hookform/resolvers@3.9.1` - Form + Zod integration
- ✅ `lucide-react@0.468.0` - Icon library
- ✅ `date-fns@4.1.0` - Date utilities
- ✅ `react-hot-toast@2.4.1` - Toast notifications
- ✅ `clsx@2.1.1` - Conditional classes
- ✅ `tailwind-merge@2.6.0` - Tailwind class merging

### Dev Dependencies
- ✅ `typescript@5.9.3` - TypeScript compiler
- ✅ `vite@7.2.4` - Build tool
- ✅ `tailwindcss@3.4.17` - CSS framework
- ✅ `postcss@8.4.49` - CSS processing
- ✅ `autoprefixer@10.4.20` - CSS vendor prefixes
- ✅ `eslint@9.39.1` - Linting
- ✅ All @types packages for TypeScript

## 🎨 Configuraciones Creadas

### ✅ Tailwind CSS
- `tailwind.config.js` - Configuración completa con el sistema de diseño
- `postcss.config.js` - PostCSS setup
- `src/index.css` - Estilos globales con @tailwind directives

### ✅ TypeScript
- `tsconfig.json` - Config principal
- `tsconfig.app.json` - Config de app (con path aliases)
- `tsconfig.node.json` - Config de Node

### ✅ Vite
- `vite.config.ts` - Con alias @/ y proxy para API

### ✅ Environment Variables
- `.env.example` - Template
- `.env` - Variables locales

### ✅ Constants
- `src/constants/config.ts` - Configuración centralizada

## 🏃 Scripts Disponibles

```bash
# Desarrollo (con hot reload)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔧 Verificación Post-Instalación

### 1. Verificar que no hay errores de tipos
```bash
npm run type-check
```

### 2. Iniciar servidor de desarrollo
```bash
npm run dev
```

Deberías ver:
```
  VITE v7.2.4  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. Verificar Tailwind
Abre el navegador en `http://localhost:5173` y verifica que:
- Los estilos se aplican correctamente
- El fondo es oscuro (#0A0A0A)
- La fuente es Inter

## 📁 Estructura Creada

```
✅ /api - Services
✅ /components - React components
  ✅ /ui - Base components
  ✅ /layout - Layouts
  ✅ /products - Product components
  ✅ /cart - Cart components
  ✅ /checkout - Checkout components
  ✅ /auth - Auth components
  ✅ /admin - Admin components
✅ /pages - Page components
  ✅ /admin - Admin pages
✅ /store - Zustand stores
✅ /hooks - Custom hooks
✅ /types - TypeScript types
✅ /schemas - Zod schemas
✅ /utils - Utilities
✅ /constants - Constants & config
```

## 🎯 Próximos Pasos

Ahora que todo está instalado y configurado:

1. ✅ Dependencias instaladas
2. ✅ Tailwind configurado
3. ✅ TypeScript configurado
4. ✅ Vite configurado
5. ✅ Structure creada
6. ⏳ Crear componentes UI base
7. ⏳ Configurar React Router
8. ⏳ Crear Zustand stores
9. ⏳ Configurar axios con interceptors
10. ⏳ Crear tipos TypeScript
11. ⏳ Implementar autenticación

## 🐛 Troubleshooting

### Error: Cannot find module '@types/node'
```bash
npm install --save-dev @types/node
```

### Error: Tailwind classes no aplican
1. Verificar que `index.css` tiene las directivas @tailwind
2. Verificar que `main.tsx` importa `index.css`
3. Reiniciar el servidor de desarrollo

### Error: Path alias '@/' no funciona
1. Verificar `vite.config.ts` tiene el alias configurado
2. Verificar `tsconfig.app.json` tiene "paths" configurado
3. Reiniciar el servidor de desarrollo

## 📚 Documentación

- [React 19 Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

## ✨ Tips

1. **Alias @/** - Usa `@/` para importar desde `src/`
   ```typescript
   import { Button } from '@/components/ui/Button'
   ```

2. **Tailwind IntelliSense** - Instala la extensión de VSCode
   - "Tailwind CSS IntelliSense"

3. **Type Safety** - TypeScript te ayudará a evitar errores
   - Usa `npm run type-check` frecuentemente

4. **Hot Reload** - Los cambios se reflejan automáticamente
   - No necesitas reiniciar el servidor

---

**Creado por:** Pedro Fabricio  
**Fecha:** 28 de Noviembre, 2024  
**Lema:** "No es suerte, es esfuerzo" - Franco Sport
