# 👨‍💼 Admin Pages

Páginas del panel administrativo (requiere role='ADMIN').

## Páginas:
- `AdminDashboard.tsx` - Dashboard principal (RF-026)
- `AdminProducts.tsx` - Listado de productos (RF-027)
- `AdminProductCreate.tsx` - Crear producto
- `AdminProductEdit.tsx` - Editar producto
- `AdminOrders.tsx` - Listado de pedidos (RF-031)
- `AdminOrderDetail.tsx` - Detalle de pedido
- `AdminUsers.tsx` - Gestión de usuarios (RF-032)
- `AdminCoupons.tsx` - Gestión de cupones (RF-033)
- `AdminCategories.tsx` - Gestión de categorías (RF-029)
- `AdminBrands.tsx` - Gestión de marcas (RF-030)
- `AdminShipping.tsx` - Configuración de envíos (RF-034)
- `AdminReviews.tsx` - Moderación de reseñas (RF-035)
- `AdminSettings.tsx` - Configuración del sitio (RF-037)
- `AdminLogs.tsx` - Logs de actividad (RF-036)

## Acceso:
- Solo usuarios con role='ADMIN'
- Redirección automática si no autorizado
- Layout específico con sidebar
