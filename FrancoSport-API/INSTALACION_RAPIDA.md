# 🚀 INSTALACIÓN RÁPIDA - Franco Sport API

## ⚡ Quick Start (5 minutos)

### 1️⃣ Instalar Dependencias

```bash
cd FrancoSport-API
npm install
```

### 2️⃣ Configurar Base de Datos

**Opción A: MySQL ya instalado**

Abre MySQL Workbench o tu cliente MySQL:

```sql
CREATE DATABASE francosport CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Opción B: Instalar MySQL**

1. Descarga: https://dev.mysql.com/downloads/mysql/
2. Instala con las opciones por defecto
3. Recuerda la contraseña de root

### 3️⃣ Configurar Variables de Entorno

```bash
# Copia el archivo ejemplo
cp .env.example .env
```

Edita `.env` y cambia:

```env
DATABASE_URL="mysql://root:TU_PASSWORD_AQUI@localhost:3306/francosport"
JWT_SECRET=cambia_este_secreto_por_algo_seguro_123456
```

### 4️⃣ Crear Tablas

```bash
npm run db:push
```

Deberías ver: ✅ Your database is now in sync with your schema.

### 5️⃣ Poblar con Datos de Prueba

```bash
npm run db:seed
```

Verás:
- ✅ Usuarios creados
- ✅ Categorías creadas
- ✅ Marcas creadas
- ✅ Productos creados
- ✅ Métodos de envío configurados
- ✅ Cupones creados

### 6️⃣ Iniciar Servidor

```bash
npm run dev
```

Deberías ver:

```
🚀 ========================================
🔴 Franco Sport API is running!
⚡ "No es suerte, es esfuerzo"
📡 Server: http://localhost:3000
🌍 Environment: development
========================================
```

### 7️⃣ Probar la API

Abre tu navegador o Postman:

```
http://localhost:3000/api/health
```

Deberías ver:

```json
{
  "success": true,
  "message": "Franco Sport API is running! 🔴⚡",
  "timestamp": "2024-11-29T...",
  "environment": "development"
}
```

---

## 🧪 Probar Endpoints

### Login (Obtener Token)

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@francosport.com",
  "password": "admin123"
}
```

Copia el `token` de la respuesta.

### Obtener Productos

```bash
GET http://localhost:3000/api/products
```

### Agregar al Carrito (requiere token)

```bash
POST http://localhost:3000/api/cart/items
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

---

## 🎯 Credenciales de Prueba

**Admin:**
- Email: `admin@francosport.com`
- Password: `admin123`

**Cliente:**
- Email: `cliente@francosport.com`
- Password: `user123`

---

## 🛠️ Herramientas Recomendadas

### Postman (Probar API)
- Descarga: https://www.postman.com/downloads/
- Importa la colección de Franco Sport (próximamente)

### Prisma Studio (Ver Base de Datos)
```bash
npm run db:studio
```
- Abre: http://localhost:5555
- Explora y edita datos visualmente

---

## ❌ Problemas Comunes

### Error: "Can't connect to MySQL server"

✅ **Solución:**
1. Verifica que MySQL esté corriendo
2. Verifica usuario/password en `.env`
3. Verifica que el puerto sea 3306

### Error: "Database 'francosport' does not exist"

✅ **Solución:**
```sql
CREATE DATABASE francosport;
```

### Error: "P1001: Can't reach database server"

✅ **Solución:**
- Windows: Abre "Servicios" y busca "MySQL", click "Iniciar"
- Mac/Linux: `sudo service mysql start`

### Error: "Port 3000 already in use"

✅ **Solución:**
Cambia el puerto en `.env`:
```env
PORT=3001
```

---

## 📚 Siguiente Paso

Una vez que el backend esté corriendo:

1. ✅ Conecta el frontend (FrancoSport-web)
2. ✅ Actualiza las API URLs en el frontend
3. ✅ Prueba el flujo completo

---

**¿Todo funcionó?** 🎉  
Continúa con la integración del frontend!

**¿Problemas?** 🆘  
Revisa los logs del servidor o contacta al desarrollador.
