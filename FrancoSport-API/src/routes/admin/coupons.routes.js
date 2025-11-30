import express from 'express';
import { body } from 'express-validator';
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

// Validation rules
const couponValidation = [
  body('code').notEmpty().withMessage('El código es requerido')
    .isLength({ min: 3 }).withMessage('El código debe tener al menos 3 caracteres')
    .matches(/^[a-zA-Z0-9]+$/).withMessage('El código solo puede contener letras y números'),
  body('discount_type').isIn(['PERCENTAGE', 'FIXED']).withMessage('Tipo de descuento inválido'),
  body('discount_value').isFloat({ min: 0 }).withMessage('El valor del descuento debe ser mayor a 0'),
  body('start_date').isISO8601().withMessage('Fecha de inicio inválida'),
  body('end_date').isISO8601().withMessage('Fecha de fin inválida')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      return true;
    }),
];

// Routes
router.get('/', getCoupons);
router.get('/:id', getCoupon);
router.post('/', couponValidation, validate, createCoupon);
router.put('/:id', couponValidation, validate, updateCoupon);
router.delete('/:id', deleteCoupon);
router.patch('/:id/toggle-status', toggleCouponStatus);

export default router;
