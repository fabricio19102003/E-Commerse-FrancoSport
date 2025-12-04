import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store';
import { initGA, logPageView } from '@/api/analytics.service';

// Layouts
import MainLayout from '@/components/layout/MainLayout';

// Auth Components
import { ProtectedRoute, AdminRoute, GuestRoute } from '@/components/auth';

// Public Pages
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Categories from '@/pages/Categories';
import Brands from '@/pages/Brands';
import PromotionDetails from '@/pages/PromotionDetails';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Profile from '@/pages/Profile';
import OrderDetail from '@/pages/OrderDetail';
import Wishlist from '@/pages/Wishlist';
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
  AdminReports,
  AdminChat,
  AdminPromotions,
  AdminPaymentSettings,
  AdminMarketing,
} from '@/pages/admin';

import ChatWidget from '@/components/chat/ChatWidget';

// Protected Pages// Placeholder components for routes not yet implemented


const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    logPageView();
  }, [location]);

  return null;
};

function App() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    initGA();
  }, [isAuthenticated]);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <RouteChangeTracker />
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
        <ConfirmationModal />
        <ChatWidget />

        <Routes>
          {/* ===== PUBLIC ROUTES WITH LAYOUT ===== */}
          <Route element={<MainLayout />}>
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.PRODUCTS} element={<Products />} />
            <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetail />} />
            <Route path={ROUTES.CATEGORIES} element={<Categories />} />
            <Route path={ROUTES.BRANDS} element={<Brands />} />
            <Route path="/promociones/:id" element={<PromotionDetails />} />
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
            <Route path={ROUTES.CART} element={<Cart />} />
            <Route
              path={ROUTES.CHECKOUT}
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PROFILE}
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ORDER_DETAIL}
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ORDERS}
              element={
                <ProtectedRoute>
                  <Navigate to={`${ROUTES.PROFILE}?tab=orders`} replace />
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

            {/* Promotions */}
            <Route path={ROUTES.ADMIN_PROMOTIONS} element={<AdminPromotions />} />
            
            {/* Shipping */}
            <Route path={ROUTES.ADMIN_SHIPPING} element={<AdminShipping />} />
            
            {/* Reviews */}
            <Route path={ROUTES.ADMIN_REVIEWS} element={<AdminReviews />} />

            {/* Chat */}
            <Route path={ROUTES.ADMIN_CHAT} element={<AdminChat />} />

            {/* Payments */}
            <Route path={ROUTES.ADMIN_PAYMENTS} element={<AdminPaymentSettings />} />
            
            {/* Settings */}
            <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettings />} />
            <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReports />} />
            <Route path={ROUTES.ADMIN_MARKETING} element={<AdminMarketing />} />
          </Route>

          {/* ===== ERROR ROUTES ===== */}
          <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
          <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
