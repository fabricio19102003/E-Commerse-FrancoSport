import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ROUTES } from '@/constants/routes';

// Layouts
import MainLayout from '@/components/layout/MainLayout';

// Auth Components
import { ProtectedRoute, AdminRoute, GuestRoute } from '@/components/auth';

// Public Pages
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';

// Auth Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Admin Pages
import {
  AdminLayout,
  AdminDashboard,
  AdminProducts,
  AdminProductForm,
  AdminOrders,
  AdminOrderDetail,
  AdminUsers,
  AdminCategories,
  AdminBrands,
  AdminCoupons,
  AdminShipping,
  AdminReviews,
  AdminSettings,
} from '@/pages/admin';

// Protected Pages (Placeholder - crearemos después)
const Profile = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gradient">Mi Perfil</h1></div>;
const Orders = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gradient">Mis Pedidos</h1></div>;
const Wishlist = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gradient">Mis Favoritos</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A1A',
            color: '#FFFFFF',
            border: '1px solid #252525',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

      <Routes>
        {/* ===== PUBLIC ROUTES WITH LAYOUT ===== */}
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.PRODUCTS} element={<Products />} />
          {/* TODO: Agregar más rutas públicas aquí */}
        </Route>

        {/* ===== AUTH ROUTES (GUEST ONLY) ===== */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* ===== PROTECTED ROUTES (AUTHENTICATED USERS) ===== */}
        <Route element={<MainLayout />}>
          <Route
            path={ROUTES.PROFILE}
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ORDERS}
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.WISHLIST}
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ===== ADMIN ROUTES (ADMIN ONLY) ===== */}
        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path={ROUTES.ADMIN} element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
          
          {/* Products */}
          <Route path={ROUTES.ADMIN_PRODUCTS} element={<AdminProducts />} />
          <Route path={ROUTES.ADMIN_PRODUCT_CREATE} element={<AdminProductForm />} />
          <Route path={`${ROUTES.ADMIN_PRODUCTS}/editar/:id`} element={<AdminProductForm />} />
          
          {/* Orders */}
          <Route path={ROUTES.ADMIN_ORDERS} element={<AdminOrders />} />
          <Route path={`${ROUTES.ADMIN_ORDERS}/:orderNumber`} element={<AdminOrderDetail />} />
          
          {/* Users */}
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
          
          {/* Categories & Brands */}
          <Route path={ROUTES.ADMIN_CATEGORIES} element={<AdminCategories />} />
          <Route path={ROUTES.ADMIN_BRANDS} element={<AdminBrands />} />
          
          {/* Coupons */}
          <Route path={ROUTES.ADMIN_COUPONS} element={<AdminCoupons />} />
          
          {/* Shipping */}
          <Route path={ROUTES.ADMIN_SHIPPING} element={<AdminShipping />} />
          
          {/* Reviews */}
          <Route path={ROUTES.ADMIN_REVIEWS} element={<AdminReviews />} />
          
          {/* Settings */}
          <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettings />} />
        </Route>

        {/* ===== ERROR ROUTES ===== */}
        <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
