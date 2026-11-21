/**
 * Order Routes
 * Franco Sport E-Commerce
 */

import express from 'express';
import { body } from 'express-validator';
import { getOrders, getOrder, cancelOrder, createOrder } from '../controllers/order.controller.js';
import { authenticate, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const createOrderRoutes = (limiters) => {
  const router = express.Router();

  // Strict JSON numbers: strings like "2" or "1.5" are rejected
  const isIntegerBetween = (min, max) => (value) => Number.isInteger(value) && value >= min && value <= max;
  const isPositiveInteger = isIntegerBetween(1, Number.MAX_SAFE_INTEGER);

  // All order routes require authentication
  router.use(authenticate);

  /**
   * @route   POST /api/orders
   * @desc    Create new order (optional coupon_code, or redeem_points, not both)
   * @access  Private
   */
  router.post(
    '/',
    requireVerifiedEmail,
    limiters.orderCreate,
    [
      body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
      body('items').isArray({ max: 50 }).withMessage('El pedido no puede tener más de 50 productos'),
      body('items.*.product_id').custom(isPositiveInteger).withMessage('ID de producto inválido'),
      body('items.*.variant_id').optional({ nullable: true }).custom(isPositiveInteger).withMessage('ID de variante inválido'),
      body('items.*.quantity').custom(isIntegerBetween(1, 99)).withMessage('La cantidad debe ser un número entero entre 1 y 99'),
      body('shipping_address_id').custom(isPositiveInteger).withMessage('Dirección de envío inválida'),
      body('shipping_method_id').custom(isPositiveInteger).withMessage('Método de envío inválido'),
      body('payment_method').isIn(['CASH_ON_DELIVERY', 'BANK_TRANSFER', 'QR_TRANSFER']).withMessage('Método de pago inválido'),
      body('redeem_points')
        .optional({ nullable: true })
        .custom(isIntegerBetween(0, Number.MAX_SAFE_INTEGER))
        .withMessage('Los puntos a canjear deben ser un número entero mayor o igual a 0'),
      body('coupon_code')
        .optional({ nullable: true })
        .custom((value) => typeof value === 'string' && value.trim().length <= 50)
        .withMessage('Código de cupón inválido'),
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

  return router;
};
