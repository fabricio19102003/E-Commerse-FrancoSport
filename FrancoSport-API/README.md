# 🔴⚡ Franco Sport API

> "No es suerte, es esfuerzo"

API REST para la plataforma de e-commerce Franco Sport, construida con Node.js, Express, Prisma y MySQL.

## 🚀 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Prisma** - ORM para MySQL
- **MySQL** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **Express Validator** - Validación de datos

## 📋 Requisitos Previos

- Node.js 18+ instalado
- MySQL 8.0+ instalado y corriendo
- npm o yarn

## ⚙️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Base de datos MySQL
DATABASE_URL="mysql://root:tu_password@localhost:3306/francosport"

# JWT
JWT_SECRET=tu_super_secreto_jwt_cambialo_en_produccion

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 3. Crear base de datos

Abre MySQL y crea la base de datos:

```sql
CREATE DATABASE francosport CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Ejecutar migraciones de Prisma

```bash
npm run db:push
```

Este comando creará todas las tablas en la base de datos.

### 5. Poblar base de datos (Seed)

```bash
npm run db:seed
```

Esto creará:
- 2 usuarios (admin y cliente)
- 3 categorías (Elite, Pro, Sport)
- 3 marcas
- 4 productos con imágenes
- Métodos de envío
- Cupones de descuento

## 🎯 Uso

### Modo Desarrollo

```bash
npm run dev
```

El servidor iniciará en `http://localhost:3000`

### Modo Producción

```bash
npm start
```

### Prisma Studio (Explorador de BD)

```bash
npm run db:studio
```

Abre una interfaz gráfica para ver y editar la base de datos en `http://localhost:5555`

## 📡 Endpoints

### Health Check

```http
GET /api/health
```

### Autenticación

```http
POST /api/auth/register       # Registrar usuario
POST /api/auth/login          # Iniciar sesión
GET  /api/auth/me             # Obtener usuario actual (requiere auth)
```

### Productos

```http
GET /api/products              # Listar productos (con filtros)
GET /api/products/:slug        # Obtener producto por slug
GET /api/products/categories   # Listar categorías
GET /api/products/brands       # Listar marcas
```

### Carrito

```http
GET    /api/cart               # Obtener carrito (requiere auth)
POST   /api/cart/items         # Agregar item (requiere auth)
PUT    /api/cart/items/:id     # Actualizar cantidad (requiere auth)
DELETE /api/cart/items/:id     # Eliminar item (requiere auth)
DELETE /api/cart               # Vaciar carrito (requiere auth)
```

### Pedidos

```http
GET  /api/orders                    # Listar pedidos del usuario (requiere auth)
GET  /api/orders/:orderNumber       # Obtener pedido específico (requiere auth)
POST /api/orders/:orderNumber/cancel # Cancelar pedido (requiere auth)
```

### Usuario

```http
GET    /api/users/profile           # Obtener perfil (requiere auth)
PUT    /api/users/profile           # Actualizar perfil (requiere auth)
PUT    /api/users/password          # Cambiar contraseña (requiere auth)
GET    /api/users/addresses         # Listar direcciones (requiere auth)
POST   /api/users/addresses         # Crear dirección (requiere auth)
PUT    /api/users/addresses/:id     # Actualizar dirección (requiere auth)
DELETE /api/users/addresses/:id     # Eliminar dirección (requiere auth)
```

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación.

### Cómo usar:

1. **Registrarse o iniciar sesión** para obtener un token
2. **Incluir el token** en el header de las peticiones protegidas:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Credenciales de Prueba (después del seed):

**Admin:**
- Email: `admin@francosport.com`
- Password: `admin123`

**Cliente:**
- Email: `cliente@francosport.com`
- Password: `user123`

## 📂 Estructura del Proyecto

```
FrancoSport-API/
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   └── seed.js             # Datos de prueba
├── src/
│   ├── controllers/        # Lógica de negocio
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   └── user.controller.js
│   ├── middleware/         # Middleware
│   │   ├── auth.js         # Autenticación JWT
│   │   ├── validate.js     # Validación
│   │   ├── errorHandler.js # Manejo de errores
│   │   └── notFound.js     # 404
│   ├── routes/             # Definición de rutas
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   └── user.routes.js
│   ├── utils/              # Utilidades
│   │   ├── prisma.js       # Cliente de Prisma
│   │   └── jwt.js          # Funciones JWT
│   └── server.js           # Punto de entrada
├── .env.example            # Variables de entorno ejemplo
├── .gitignore
└── package.json
```

## 🗄️ Modelo de Datos

### Principales Entidades:

- **Users** - Usuarios del sistema (ADMIN, CUSTOMER, MODERATOR)
- **Products** - Productos con variantes, imágenes y tags
- **Categories** - Categorías jerárquicas
- **Brands** - Marcas de productos
- **Cart** - Carritos de compra
- **Orders** - Pedidos con historial de estados
- **Addresses** - Direcciones de envío/facturación
- **Reviews** - Reseñas de productos
- **Coupons** - Cupones de descuento
- **ShippingMethods** - Métodos de envío por zona

## 🔧 Scripts Disponibles

```bash
npm run dev          # Iniciar en modo desarrollo (con nodemon)
npm start            # Iniciar en modo producción
npm run db:push      # Sincronizar schema con base de datos
npm run db:seed      # Poblar base de datos con datos de prueba
npm run db:studio    # Abrir Prisma Studio
```

## 🐛 Debugging

Si encuentras errores:

1. **Verifica que MySQL esté corriendo**
2. **Verifica las credenciales en `.env`**
3. **Asegúrate de haber creado la base de datos**
4. **Revisa los logs del servidor en la consola**

## 📝 Próximas Funcionalidades

- [ ] Checkout y procesamiento de pagos con Stripe
- [ ] Sistema de reviews y ratings
- [ ] Wishlist
- [ ] Panel administrativo (CRUD completo)
- [ ] Notificaciones por email
- [ ] Upload de imágenes a Cloudinary
- [ ] Reportes y analytics

## 👨‍💻 Desarrollador

**Pedro Fabricio**  
Franco Sport E-Commerce  
"No es suerte, es esfuerzo"

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2024
