/**
 * Order Routes
 * Franco Sport E-Commerce
 */

import express from 'express';
import { body } from 'express-validator';
import { getOrders, getOrder, cancelOrder, createOrder } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
    body('shipping_address_id').isInt().withMessage('Dirección de envío inválida'),
    body('payment_method').isIn(['CASH_ON_DELIVERY', 'BANK_TRANSFER', 'QR_TRANSFER']).withMessage('Método de pago inválido'),
    validate
  ],
  createOrder
);

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
