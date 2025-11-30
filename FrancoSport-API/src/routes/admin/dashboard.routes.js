/**
 * Admin Dashboard Routes
 * Franco Sport API
 */

import express from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import * as dashboardController from '../../controllers/admin/dashboard.controller.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate, requireAdmin);

// GET /api/admin/dashboard/stats - Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// GET /api/admin/dashboard/recent-orders - Get recent orders
router.get('/recent-orders', dashboardController.getRecentOrders);

// GET /api/admin/dashboard/top-products - Get top selling products
router.get('/top-products', dashboardController.getTopProducts);

// GET /api/admin/dashboard/sales - Get sales by period
router.get('/sales', dashboardController.getSalesByPeriod);

export default router;
