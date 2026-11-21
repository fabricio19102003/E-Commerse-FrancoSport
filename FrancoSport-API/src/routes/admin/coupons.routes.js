import express from 'express';
import { body, param } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
} from '../../controllers/admin/coupons.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate, requireAdmin);

// Decimal(10,2) columns hold up to 99999999.99
const MAX_AMOUNT = 99999999.99;
const isMoney = (value, { min = 0, exclusiveMin = false } = {}) => {
  const amount = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
  if (typeof value === 'boolean' || !Number.isFinite(amount) || amount > MAX_AMOUNT) return false;
  return exclusiveMin ? amount > min : amount >= min;
};
const hasAtMostTwoDecimals = (value) => /^-?\d+(\.\d{1,2})?$/.test(String(value).trim());
const isOptional = { values: 'null' };

// Same fields as the Prisma Coupon model; PUT replaces them, so both share the rules
const couponValidation = [
  body('code')
    .isString().withMessage('El código es requerido').bail()
    .trim()
    .notEmpty().withMessage('El código es requerido').bail()
    .isLength({ min: 3, max: 50 }).withMessage('El código debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9]+$/).withMessage('El código solo puede contener letras y números')
    .customSanitizer((value) => value.toUpperCase()),
  body('description')
    .isString().withMessage('La descripción es requerida').bail()
    .trim()
    .notEmpty().withMessage('La descripción es requerida').bail()
    .isLength({ max: 500 }).withMessage('La descripción no puede superar los 500 caracteres'),
  body('discount_type').isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']).withMessage('Tipo de descuento inválido'),
  // FREE_SHIPPING discounts the shipping cost, so it has no discount value (stored as 0)
  body('discount_value')
    .if((value, { req }) => req.body.discount_type !== 'FREE_SHIPPING')
    .custom((value) => isMoney(value, { exclusiveMin: true })).withMessage('El valor del descuento debe ser mayor a 0').bail()
    .custom(hasAtMostTwoDecimals).withMessage('El valor del descuento admite hasta 2 decimales')
    .custom((value, { req }) => req.body.discount_type !== 'PERCENTAGE' || Number(value) <= 100)
    .withMessage('El porcentaje de descuento no puede ser mayor a 100'),
  body('minimum_purchase_amount').optional(isOptional)
    .custom((value) => isMoney(value) && hasAtMostTwoDecimals(value))
    .withMessage('La compra mínima debe ser un monto mayor o igual a 0 (máximo 2 decimales)'),
  body('maximum_discount_amount').optional(isOptional)
    .custom((value) => isMoney(value, { exclusiveMin: true }) && hasAtMostTwoDecimals(value))
    .withMessage('El descuento máximo debe ser mayor a 0 (máximo 2 decimales)'),
  body('usage_limit_total').optional(isOptional)
    .isInt({ min: 1, max: 2147483647 }).withMessage('El límite total de usos debe ser un número entero mayor a 0').bail()
    .toInt(),
  body('usage_limit_per_user').optional(isOptional)
    .isInt({ min: 1, max: 2147483647 }).withMessage('El límite de usos por cliente debe ser un número entero mayor a 0').bail()
    .toInt(),
  body('starts_at').isISO8601({ strict: true }).withMessage('Fecha de inicio inválida'),
  body('expires_at').isISO8601({ strict: true }).withMessage('Fecha de vencimiento inválida').bail()
    .custom((value, { req }) => {
      const start = new Date(req.body.starts_at);
      return Number.isNaN(start.getTime()) || new Date(value) > start;
    })
    .withMessage('La fecha de vencimiento debe ser posterior a la fecha de inicio'),
  body('is_active').optional().isBoolean({ strict: true }).withMessage('El estado debe ser verdadero o falso'),
];

const idValidation = param('id').isInt({ min: 1 }).withMessage('ID de cupón inválido');

// Routes
router.get('/', getCoupons);
router.get('/:id', idValidation, validate, getCoupon);
router.post('/', couponValidation, validate, createCoupon);
router.put('/:id', idValidation, couponValidation, validate, updateCoupon);
router.delete('/:id', idValidation, validate, deleteCoupon);
router.patch('/:id/toggle-status', idValidation, validate, toggleCouponStatus);

export default router;
