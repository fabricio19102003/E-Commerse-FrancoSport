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

# Opcional: proxy inverso delante de la API (ver "Límites de peticiones")
# TRUST_PROXY=1
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
- Configuración de pago por QR/transferencia con **datos de ejemplo** (imagen QR y datos bancarios de relleno; cámbialos en el panel admin antes de vender). Si ya existe una configuración, el seed no la sobrescribe.

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
POST /api/orders                    # Crear pedido (requiere auth)
GET  /api/orders                    # Listar pedidos del usuario (requiere auth)
GET  /api/orders/:orderNumber       # Obtener pedido específico (requiere auth)
POST /api/orders/:orderNumber/cancel # Cancelar pedido (requiere auth)
```

Al crear un pedido el cliente envía `items` (`product_id`, `variant_id` opcional, `quantity` entero de 1 a 99),
`shipping_address_id`, `shipping_method_id`, `payment_method` y, opcionalmente, `redeem_points` (entero ≥ 0).
Los precios, el costo de envío y el total se calculan siempre en el servidor.

### Métodos de envío

```http
GET /api/shipping-methods           # Métodos activos en zonas activas (público)
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
npm test             # Ejecutar las pruebas (ver sección Pruebas)
```

## 🧪 Pruebas

Las pruebas (Vitest + supertest) usan una base de datos MySQL desechable en Docker; nunca la base de desarrollo.
Cada ejecución reinicia el esquema con `prisma db push --force-reset` (solo en 127.0.0.1/localhost y si el nombre de la base es `test` o lleva `test` separado por `_`, p. ej. `fs_test`).

```bash
# 1. Levantar MySQL de pruebas (una vez)
docker run -d --name fs-test-mysql -e MYSQL_ROOT_PASSWORD=test -e MYSQL_DATABASE=fs_test \
  -p 127.0.0.1:33306:3306 mysql:8.4

# 2. Ejecutar las pruebas (espera unos segundos a que MySQL termine de iniciar la primera vez)
npm test

# 3. Al terminar, eliminar el contenedor
docker rm -f fs-test-mysql
```

La URL de pruebas (`mysql://root:test@127.0.0.1:33306/fs_test`) y los secretos JWT de prueba están en
`tests/test-env.js`; se puede cambiar la base con `TEST_DATABASE_URL`.
Las pruebas nunca llaman a Cloudinary: se simula solo el adaptador `src/services/storage.service.js`.

## 🚦 Límites de peticiones

Los límites se cuentan en memoria por proceso y se reinician al cambiar de ventana (15 minutos). Al excederlos la API responde `429` con un mensaje en castellano. Se desactivan con `NODE_ENV=test`.

| Ruta | Límite (cada 15 min) | Clave |
| --- | --- | --- |
| Toda la API | 600 | IP |
| `POST /api/auth/login`, `/register`, `/refresh` | 10 por ruta | IP |
| `POST /api/auth/login`, `/register` | 10 por ruta | correo (sin distinguir mayúsculas) |
| `POST /api/orders` | 20 | usuario |
| `POST /api/payment/proof/:orderId` | 10 | usuario (siempre activo) |

### `TRUST_PROXY`

Variable de entorno opcional que se pasa a Express `trust proxy` para que los límites vean la IP real del cliente (`X-Forwarded-For`) y no la del proxy.

- Sin definir (o `false`): sin proxy; `X-Forwarded-For` se ignora (no se puede falsificar para saltarse los límites).
- `1`: un proxy inverso delante de la API (nginx, Render, Railway…). Un número indica cuántos proxies confiables hay delante.
- Otros valores (`loopback`, lista de CIDR) se pasan tal cual a Express.

No uses `true`: confiaría en cualquier `X-Forwarded-For` y permitiría evadir los límites. Si la API está detrás de un proxy y no defines `TRUST_PROXY`, todos los clientes compartirán la misma IP y se bloquearán entre sí.

## 🖼️ Subida de imágenes y pagos por transferencia

- `POST /api/upload/image(s)` y `DELETE /api/upload/image/<public id>`: solo administradores. Solo JPG/PNG/WEBP, máx. 5 MB, se valida el contenido real; borrar solo funciona dentro de la carpeta `franco-sport/`.
- Clientes: `POST /api/payment/proof/:orderId` (campo `image`), solo el dueño del pedido, pedidos `QR_TRANSFER`/`BANK_TRANSFER` no cancelados con pago pendiente (o rechazado). Máx. 10 subidas por usuario cada 15 minutos. El pedido se crea primero (`payment_proof_url` ya no se acepta al crearlo) y el comprobante se sube después.
- `POST /api/admin/payment/approve/:orderId`: solo pedidos con pago pendiente y comprobante, sin cancelar ni reembolsar; una aprobación repetida o simultánea responde 409. Opcionalmente recibe `payment_proof_url` (el comprobante que vio el admin); si ya cambió responde 409. Si un cliente intenta cancelar un pedido con pago aprobado responde 400 (debe contactar a la tienda).
- Al reemplazar un comprobante se borra la imagen anterior de Cloudinary (si está en la carpeta `franco-sport/`).

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
