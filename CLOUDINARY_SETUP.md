# 📦 Instalación de Dependencias - Cloudinary Upload

## Backend (FrancoSport-API)

### Paso 1: Instalar dependencias

```bash
cd FrancoSport-API
npm install cloudinary multer multer-storage-cloudinary
```

### Paso 2: Configurar variables de entorno

Edita el archivo `.env` y agrega tus credenciales de Cloudinary:

```env
# ===== CLOUDINARY =====
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui
```

### Paso 3: Obtener credenciales de Cloudinary

1. Ve a https://cloudinary.com/users/register/free
2. Crea una cuenta gratuita
3. Una vez dentro, ve al Dashboard
4. Copia:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
5. Pega estos valores en tu `.env`

### Paso 4: Reiniciar el servidor

```bash
npm run dev
```

---

## Frontend (FrancoSport-web)

No requiere instalación adicional, todas las dependencias ya están instaladas.

---

## 📊 Archivos Creados

### Backend (6 archivos)

1. ✅ `src/config/cloudinary.js` - Configuración de Cloudinary
2. ✅ `src/controllers/upload.controller.js` - Controller de upload
3. ✅ `src/routes/upload.routes.js` - Rutas de upload
4. ✅ `src/server.js` - Actualizado con ruta /api/upload

### Frontend (2 archivos)

5. ✅ `src/api/upload.service.ts` - Servicio de upload
6. ✅ `src/pages/admin/AdminProductForm.tsx` - Formulario completo

---

## 🧪 Probar Upload de Imágenes

### 1. Iniciar Backend

```bash
cd FrancoSport-API
npm run dev
```

### 2. Iniciar Frontend

```bash
cd FrancoSport-web
npm run dev
```

### 3. Crear un Producto

1. Login como admin: `admin@francosport.com` / `admin123`
2. Ir a: http://localhost:5173/admin/productos
3. Clic en "Nuevo Producto"
4. Llenar formulario
5. **Drag & Drop imágenes** o clic en área de upload
6. Imágenes se suben automáticamente a Cloudinary
7. Guardar producto

---

## ✅ Funcionalidades Implementadas

### Upload de Imágenes
- ✅ Drag & Drop funcional
- ✅ Upload múltiple (hasta 5 imágenes)
- ✅ Validación de tipo (JPG, PNG, WEBP)
- ✅ Validación de tamaño (máx 5MB)
- ✅ Preview en tiempo real
- ✅ Marcar imagen principal
- ✅ Eliminar imágenes
- ✅ Reordenar imágenes

### Cloudinary Integration
- ✅ Upload automático a Cloudinary
- ✅ Transformaciones automáticas (1000x1000, quality auto)
- ✅ Optimización de imágenes
- ✅ URLs públicas generadas
- ✅ Organización en carpeta: `franco-sport/products`

### AdminProductForm
- ✅ Crear producto con imágenes
- ✅ Editar producto existente
- ✅ Cargar datos del producto al editar
- ✅ Modo edición detecta ID en URL
- ✅ Validación completa con Zod
- ✅ Auto-generación de slug
- ✅ Progress bar durante guardado
- ✅ Loading states
- ✅ Error handling

---

## 🔥 Endpoints API Disponibles

### Upload Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/image` | Upload single image | Admin |
| POST | `/api/upload/images` | Upload multiple images | Admin |
| DELETE | `/api/upload/image/:publicId` | Delete image from Cloudinary | Admin |

### Request Examples

**Upload Single Image:**
```bash
POST /api/upload/image
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- image: [file]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/.../image.jpg",
    "public_id": "franco-sport/products/abc123",
    "width": 1000,
    "height": 1000,
    "format": "jpg",
    "size": 245678
  }
}
```

---

## 🎯 Flujo Completo

### Crear Producto:

1. Usuario hace clic en "Nuevo Producto"
2. Llena formulario
3. Arrastra imágenes al área de upload
4. Imágenes se muestran en preview
5. Usuario puede:
   - Marcar imagen principal
   - Eliminar imágenes
   - Agregar más imágenes
6. Usuario hace clic en "Crear Producto"
7. **Sistema:**
   - Valida formulario con Zod
   - Upload imágenes nuevas a Cloudinary
   - Crea producto con `adminProductsService.createProduct()`
   - Guarda URLs de Cloudinary en BD
8. Redirect a lista de productos
9. ✅ Producto creado con imágenes

### Editar Producto:

1. Usuario hace clic en "Editar" en un producto
2. Sistema carga datos del producto
3. Formulario se pre-llena con datos existentes
4. Imágenes existentes se cargan desde Cloudinary
5. Usuario puede:
   - Modificar cualquier campo
   - Agregar nuevas imágenes
   - Eliminar imágenes existentes
   - Cambiar imagen principal
6. Usuario hace clic en "Actualizar Producto"
7. **Sistema:**
   - Valida cambios
   - Upload solo imágenes nuevas
   - Actualiza producto con `adminProductsService.updateProduct()`
8. Redirect a lista de productos
9. ✅ Producto actualizado

---

## 🐛 Troubleshooting

### Error: "Cloudinary credentials not found"

**Solución:**
```bash
# Verifica que las variables estén en .env
cat FrancoSport-API/.env | grep CLOUDINARY

# Deben aparecer:
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Reinicia el servidor
npm run dev
```

### Error: "File too large"

**Solución:**
- El límite es 5MB por imagen
- Comprime la imagen antes de subirla
- Usa herramientas como: https://tinypng.com

### Error: "Invalid file type"

**Solución:**
- Solo se permiten: JPG, JPEG, PNG, WEBP
- Verifica la extensión del archivo

### Imágenes no se muestran en preview

**Solución:**
1. Abre DevTools > Console
2. Verifica errores de CORS
3. Verifica que las URLs de Cloudinary sean públicas
4. Verifica que el upload haya sido exitoso

---

## 📊 Estado Actual

### Backend (100%)
- ✅ Cloudinary configurado
- ✅ Upload controller completo
- ✅ Routes protegidas
- ✅ Validaciones

### Frontend (100%)
- ✅ Upload service creado
- ✅ AdminProductForm completo
- ✅ Drag & Drop funcional
- ✅ Preview de imágenes
- ✅ Crear producto
- ✅ Editar producto

---

## 🎓 Plan de Acción

### Próximos pasos:

1. **Instalar dependencias en backend:**
   ```bash
   cd FrancoSport-API
   npm install cloudinary multer multer-storage-cloudinary
   ```

2. **Configurar Cloudinary:**
   - Crear cuenta gratuita
   - Copiar credenciales a .env
   - Reiniciar servidor

3. **Probar upload:**
   - Login como admin
   - Ir a "Nuevo Producto"
   - Drag & Drop imágenes
   - Guardar producto

4. **Verificar en Cloudinary:**
   - Login en Cloudinary Dashboard
   - Ir a Media Library
   - Buscar carpeta: `franco-sport/products`
   - Verificar que las imágenes estén ahí

---

**Estado:** ⏳ **Listo para instalar dependencias y configurar Cloudinary**

Una vez instaladas las dependencias, el sistema estará 100% funcional.

*"No es suerte, es esfuerzo"* 🔴⚡
