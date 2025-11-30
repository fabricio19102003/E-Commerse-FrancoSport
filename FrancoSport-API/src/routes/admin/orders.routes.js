/**
 * Admin Orders Routes
 * Franco Sport API
 */

import express from 'express';
import { body } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ordersController from '../../controllers/admin/orders.controller.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate, requireAdmin);

// GET /api/admin/orders/stats - Get order statistics
router.get('/stats', ordersController.getOrderStats);

// GET /api/admin/orders - Get all orders
router.get('/', ordersController.getOrders);

// GET /api/admin/orders/:orderNumber - Get single order
router.get('/:orderNumber', ordersController.getOrder);

// PATCH /api/admin/orders/:orderNumber/status - Update order status
router.patch(
  '/:orderNumber/status',
  [
    body('status')
      .isIn(['PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
      .withMessage('Estado inválido'),
    validate,
  ],
  ordersController.updateOrderStatus
);

// PATCH /api/admin/orders/:orderNumber/tracking - Add tracking number
router.patch(
  '/:orderNumber/tracking',
  [
    body('tracking_number').trim().notEmpty().withMessage('Número de seguimiento requerido'),
    validate,
  ],
  ordersController.addTrackingNumber
);

// POST /api/admin/orders/:orderNumber/cancel - Cancel order
router.post(
  '/:orderNumber/cancel',
  [
    body('reason').trim().notEmpty().withMessage('La razón de cancelación es requerida'),
    validate,
  ],
  ordersController.cancelOrder
);

export default router;
