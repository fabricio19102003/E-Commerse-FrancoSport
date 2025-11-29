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

// Protected Pages (Placeholder - crearemos después)
const Profile = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gradient">Mi Perfil</h1></div>;
const Orders = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gradient">Mis Pedidos</h1></div>;
const Wishlist = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gradient">Mis Favoritos</h1></div>;

// Admin Pages (Placeholder - crearemos después)
const AdminDashboard = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gradient">Admin Dashboard</h1></div>;
const AdminProducts = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gradient">Admin - Productos</h1></div>;
const AdminOrders = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold text-gradient">Admin - Pedidos</h1></div>;

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
              primary: '#DC2626',
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
        <Route element={<MainLayout />}>
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_PRODUCTS}
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_ORDERS}
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
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
