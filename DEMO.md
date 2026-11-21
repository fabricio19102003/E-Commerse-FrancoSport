# Franco Sport — Guía de demostración (local)

Guía para mostrar la tienda al propietario desde esta computadora, con un solo comando. No hace falta crear archivos `.env` ni instalar MySQL: la base de datos corre en Docker.

## Requisitos

- Linux con **Docker** (con `docker compose` v2) iniciado y accesible para su usuario.
- **Node.js 20 o superior** y **npm**.
- **curl**.
- Internet durante la demostración: las fotos de los productos de ejemplo vienen de Unsplash y el QR de ejemplo de placehold.co.

## Comandos

Desde la raíz del repositorio:

```bash
demo/start.sh   # inicia MySQL, la API y la web (la primera vez instala dependencias y compila: ~2-5 min)
demo/stop.sh    # detiene todo; los datos se conservan
demo/reset.sh   # BORRA los datos de la demo (pide confirmación) y deja todo como nuevo
```

`demo/start.sh` se puede repetir sin problema (si algo ya está en marcha, lo reutiliza) y al terminar deja la API y la web corriendo en segundo plano. Al final imprime las direcciones y las cuentas.

Direcciones (puertos elegidos para no chocar con otros proyectos; si alguno está ocupado el script lo avisa):

| Qué | Dirección |
|---|---|
| Tienda (web) | http://localhost:5183 |
| API | http://localhost:3101/api/health |
| MySQL (solo esta computadora) | 127.0.0.1:33316 |

Para usar otros puertos: `DEMO_WEB_PORT=5190 DEMO_API_PORT=3110 DEMO_DB_PORT=33320 demo/start.sh` (use siempre los mismos al volver a iniciar). Abra la tienda con `localhost` (no con la IP de la red: la API solo acepta esta computadora).

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@francosport.com` | `FrancoAdmin2026` |
| Cliente (verificado) | `cliente@francosport.com` | `FrancoCliente2026` |

Para otras contraseñas, defina `SEED_ADMIN_PASSWORD` y `SEED_USER_PASSWORD` antes del **primer** inicio (`demo/reset.sh` para repetirlo). Una contraseña cambiada desde la tienda nunca se vuelve a sobrescribir. Cupones de ejemplo: `FRANCO20` (20 %, mínimo Bs. 100, descuento máximo Bs. 50) y `ENVIOGRATIS` (envío gratis desde Bs. 200).

## Recorrido de 10 minutos

**Cliente (ventana normal)**

1. **Registro** (`/registro`): cree una cuenta nueva. Aparece el aviso «Verifique su correo».
2. **Verificación**: no hay correo real (ver «Límites»). Copie el enlace desde el registro de la API:
   ```bash
   grep -a "MOCK EMAIL" demo/.local/api.log | grep -a "verificar-correo" | tail -1 | grep -o 'http[^ ]*'
   ```
   Ábralo en el navegador: el aviso desaparece. (Sin verificar, el checkout está bloqueado.)
3. **Catálogo**: navegue por `/productos`, abra un producto y agréguelo al carrito junto con otro.
4. **Carrito y cupón**: en el carrito/checkout aplique `FRANCO20` (muestra el descuento) o `ENVIOGRATIS` con una compra desde Bs. 200.
5. **Checkout**: cree una dirección, elija un método de envío (Estándar o Express: el costo mostrado es el cobrado), elija pago por **QR/transferencia**, suba una imagen como **comprobante** y confirme el pedido.
6. **Mis pedidos** (`/mis-pedidos`): el pedido aparece con el pago «en revisión».

**Administrador (ventana de incógnito)**

1. Entre con `admin@francosport.com`: **Dashboard** (`/admin/dashboard`) con ventas y pedidos.
2. **Pedidos** (`/admin/pedidos`): abra el pedido del cliente, vea el comprobante y pulse **Aprobar Pago**.
3. **Productos** (`/admin/productos`): edite un precio o stock, o cree un producto nuevo (el formulario valida en español).
4. **Cupones** (`/admin/cupones`): cree un cupón (porcentaje, monto fijo o envío gratis).
5. **Pagos** (`/admin/pagos`): aquí se cambia el QR y los datos bancarios; los actuales son de ejemplo.
6. **Reportes** (`/admin/reportes`): elija un pedido y pulse **Exportar PDF**.

**Extra**: «¿Olvidó su contraseña?» (`/recuperar-contrasena`) también deja su enlace en el registro:
`grep -a "MOCK EMAIL" demo/.local/api.log | grep -a "restablecer-contrasena" | tail -1 | grep -o 'http[^ ]*'`

## Límites conocidos

- **Sin correo (SMTP)**: la tienda no envía correos reales. Los enlaces de verificación y de recuperación de contraseña se escriben en `demo/.local/api.log` (líneas `[MOCK EMAIL]`, comandos arriba). El registro es largo porque también anota las consultas a la base: use `grep -a`.
- **Imágenes sin Cloudinary**: no hay cuenta de Cloudinary configurada. En la demo las imágenes que se suben (productos, QR de pago, comprobantes) se guardan en esta computadora (`FrancoSport-API/storage/uploads/`) y las sirve la propia API. Este modo es **solo para desarrollo** (`STORAGE_DRIVER=local`): la API se niega a arrancar con él si `NODE_ENV=production`. Para producción hay que configurar Cloudinary. Las imágenes de ejemplo del catálogo y el QR de ejemplo son enlaces externos, no se guardan aquí.
- **Límite de intentos**: son 10 inicios de sesión o registros por IP cada 15 minutos. Si se agotan en una demostración larga, reinicie con `demo/stop.sh` y `demo/start.sh` (el contador está en memoria).
- **Datos de pago de ejemplo**: el QR y la cuenta bancaria son de ejemplo hasta que el propietario los cambie en `/admin/pagos`.
- **Solo en esta computadora**: la API, la web y MySQL escuchan únicamente en `127.0.0.1`; nadie más en la red puede abrirlas. Para mostrarla en otra pantalla, use esta computadora (o un proyector), no otro dispositivo.

## Dónde está cada cosa

- Registro de la API: `demo/.local/api.log` (el anterior queda en `api.log.1`); de la web: `demo/.local/web.log`.
- Secretos JWT generados la primera vez: `demo/.local/jwt-secrets` (permisos 0600; Git los ignora).
- Base de datos: volumen Docker `francosport-demo-mysql`.
- Si algo falla al iniciar, el script muestra el motivo; para ver MySQL: `docker compose -f demo/docker-compose.yml logs mysql`.
