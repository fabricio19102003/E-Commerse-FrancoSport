/**
 * Franco Sport API Server
 * "No es suerte, es esfuerzo"
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './socket.js';

// Import ES6 routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import userRoutes from './routes/user.routes.js';
import paymentRoutes from './routes/payment.routes.js';

// Import admin routes
import adminProductsRoutes from './routes/admin/products.routes.js';
import adminOrdersRoutes from './routes/admin/orders.routes.js';
import adminUsersRoutes from './routes/admin/users.routes.js';
import adminDashboardRoutes from './routes/admin/dashboard.routes.js';
import adminCategoriesRoutes from './routes/admin/categories.routes.js';
import adminBrandsRoutes from './routes/admin/brands.routes.js';
import adminCouponsRoutes from './routes/admin/coupons.routes.js';
import adminShippingRoutes from './routes/admin/shipping.routes.js';
import adminReviewsRoutes from './routes/admin/reviews.routes.js';
import adminPromotionsRoutes from './routes/admin/promotions.routes.js';
import adminPaymentRoutes from './routes/admin/payment.routes.js';
import adminMarketingRoutes from './routes/admin/marketing.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import sitemapRoutes from './routes/sitemap.routes.js';
import reviewRoutes from './routes/review.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import chatRoutes from './routes/chat.routes.js';
import loyaltyRoutes from './routes/loyalty.routes.js';
import promotionRoutes from './routes/promotions.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// ===== MIDDLEWARE =====

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Franco Sport API is running! 🔴⚡',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Public API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/payment', paymentRoutes);

// Admin API Routes
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/categories', adminCategoriesRoutes);
app.use('/api/admin/brands', adminBrandsRoutes);
app.use('/api/admin/coupons', adminCouponsRoutes);
app.use('/api/admin/shipping', adminShippingRoutes);
app.use('/api/admin/reviews', adminReviewsRoutes);
app.use('/api/admin/promotions', adminPromotionsRoutes);
app.use('/api/admin/payment', adminPaymentRoutes);
app.use('/api/admin/marketing', adminMarketingRoutes);

// Upload Routes
app.use('/api/upload', uploadRoutes);

// Review Routes
app.use('/api/reviews', reviewRoutes);

// Notification Routes
app.use('/api/notifications', notificationRoutes);

// Chat Routes
app.use('/api/chat', chatRoutes);

// Loyalty Routes
app.use('/api/loyalty', loyaltyRoutes);

// Wishlist Routes
app.use('/api/wishlist', wishlistRoutes);

// Sitemap
app.use('/', sitemapRoutes);

// ===== ERROR HANDLING =====

// 404 Not Found
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// ===== START SERVER =====

const PORT = process.env.PORT || 3001;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`🔴 Franco Sport API is running!`);
  console.log(`⚡ "No es suerte, es esfuerzo"`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('========================================\n');
});

export default app;
