/**
 * Coupon Routes
 * Franco Sport E-Commerce
 */

import express from 'express';
import { body } from 'express-validator';
import { validateCoupon } from '../controllers/coupon.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const createCouponRoutes = (limiters) => {
  const router = express.Router();

  // Strict JSON numbers: strings like "2" or "1.5" are rejected
  const isIntegerBetween = (min, max) => (value) => Number.isInteger(value) && value >= min && value <= max;
  const isPositiveInteger = isIntegerBetween(1, Number.MAX_SAFE_INTEGER);

  router.use(authenticate);

  /**
   * @route   POST /api/coupons/validate
   * @desc    Discount of a coupon on the customer's cart, computed on the server.
   *          Optional `items` (same shape as order creation) replace the server-side cart.
   *          `shipping_method_id` is required for FREE_SHIPPING coupons (their discount is the shipping cost).
   * @access  Private
   */
  router.post(
    '/validate',
    limiters.couponValidate,
    [
      body('code').custom((value) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 50).withMessage('Ingrese el código del cupón'),
      body('shipping_method_id').optional({ nullable: true }).custom(isPositiveInteger).withMessage('ID de método de envío inválido'),
      body('items').optional().isArray({ min: 1, max: 50 }).withMessage('Debe incluir entre 1 y 50 productos'),
      body('items.*.product_id').custom(isPositiveInteger).withMessage('ID de producto inválido'),
      body('items.*.variant_id').optional({ nullable: true }).custom(isPositiveInteger).withMessage('ID de variante inválido'),
      body('items.*.quantity').custom(isIntegerBetween(1, 99)).withMessage('La cantidad debe ser un número entero entre 1 y 99'),
      validate,
    ],
    validateCoupon
  );

  return router;
};
