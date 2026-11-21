/**
 * Franco Sport API App
 * "No es suerte, es esfuerzo"
 *
 * Express app without listening, so tests can import it.
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { localStorageEnabled, localUploadsDir } from './config/cloudinary.js';

// Import ES6 routes
import { createAuthRoutes } from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import { createOrderRoutes } from './routes/order.routes.js';
import { createCouponRoutes } from './routes/coupon.routes.js';
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
import communityRoutes from './routes/community.routes.js';
import adminCommunityRoutes from './routes/admin/community.routes.js';
import shippingRoutes from './routes/shipping.routes.js';

// ... (imports)

// Admin API Routes
// ...

// ...



// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { createRateLimiters } from './middleware/rateLimits.js';

// Load environment variables
dotenv.config();

/**
 * TRUST_PROXY: unset/empty/false = no proxy (X-Forwarded-For ignored);
 * a number = that many reverse proxies (e.g. 1); anything else is passed to
 * Express `trust proxy` as is (e.g. loopback, a CIDR list).
 */
export const parseTrustProxy = (value) => {
  const text = value?.trim();
  if (!text || text.toLowerCase() === 'false') return false;
  return /^\d+$/.test(text) ? Number(text) : text;
};

/**
 * Create the Express app. Options exist for the tests that assert the limits:
 * `rateLimits.enabled` (default: off only under NODE_ENV=test) and `trustProxy`
 * (default: the TRUST_PROXY env var).
 */
export const createApp = ({ rateLimits = {}, trustProxy = parseTrustProxy(process.env.TRUST_PROXY) } = {}) => {
  const limiters = createRateLimiters(rateLimits);
  const app = express();

  // Behind a reverse proxy the limits must see the real client IP
  app.set('trust proxy', trustProxy);

  // ===== MIDDLEWARE =====

  // CORS
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  // Rate Limiting (600 requests per 15 minutes per IP)
  // Apply rate limiting to all requests
  app.use(limiters.global);

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Images saved on this machine: DEVELOPMENT ONLY (STORAGE_DRIVER=local; never in production)
  if (localStorageEnabled() && process.env.NODE_ENV !== 'production') {
    app.use('/uploads', express.static(localUploadsDir(), { dotfiles: 'ignore', index: false, redirect: false, fallthrough: true }));
  }

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
  app.use('/api/auth', createAuthRoutes(limiters));
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', createOrderRoutes(limiters));
  app.use('/api/coupons', createCouponRoutes(limiters));
  app.use('/api/users', userRoutes);
  app.use('/api/promotions', promotionRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/shipping-methods', shippingRoutes);

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
  app.use('/api/admin/community', adminCommunityRoutes);

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

  // Community Routes
  app.use('/api/community', communityRoutes);

  // Wishlist Routes
  app.use('/api/wishlist', wishlistRoutes);

  // Sitemap
  app.use('/', sitemapRoutes);

  // ===== ERROR HANDLING =====

  // 404 Not Found
  app.use(notFound);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp();
