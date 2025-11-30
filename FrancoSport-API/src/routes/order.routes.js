/**
 * Order Routes
 * Franco Sport E-Commerce
 */

import express from 'express';
import { body } from 'express-validator';
import { getOrders, getOrder, cancelOrder } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get('/', getOrders);

/**
 * @route   GET /api/orders/:orderNumber
 * @desc    Get single order
 * @access  Private
 */
router.get('/:orderNumber', getOrder);

/**
 * @route   POST /api/orders/:orderNumber/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.post(
  '/:orderNumber/cancel',
  [body('reason').notEmpty().withMessage('La razón es obligatoria'), validate],
  cancelOrder
);

export default router;
