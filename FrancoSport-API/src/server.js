/**
 * Franco Sport API Server
 * "No es suerte, es esfuerzo"
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import ES6 routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import userRoutes from './routes/user.routes.js';

// Import admin routes
import adminProductsRoutes from './routes/admin/products.routes.js';
import adminOrdersRoutes from './routes/admin/orders.routes.js';
import adminUsersRoutes from './routes/admin/users.routes.js';
import uploadRoutes from './routes/upload.routes.js';

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

// Admin API Routes
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/users', adminUsersRoutes);

// Upload Routes
app.use('/api/upload', uploadRoutes);

// ===== ERROR HANDLING =====

// 404 Not Found
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// ===== START SERVER =====

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`🔴 Franco Sport API is running!`);
  console.log(`⚡ "No es suerte, es esfuerzo"`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('========================================\n');
});

export default app;
