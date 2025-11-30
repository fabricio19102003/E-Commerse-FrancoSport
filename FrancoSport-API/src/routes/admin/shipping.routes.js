import express from 'express';
import { body } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  getShippingMethods,
  getShippingMethod,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  toggleShippingMethodStatus
} from '../../controllers/admin/shipping.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate, requireAdmin);

// Validation rules
const shippingValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('base_cost').isFloat({ min: 0 }).withMessage('El costo base debe ser mayor o igual a 0'),
  body('cost_per_kg').optional().isFloat({ min: 0 }).withMessage('El costo por kg debe ser mayor o igual a 0'),
  body('estimated_days_min').isInt({ min: 0 }).withMessage('Los días mínimos deben ser mayor o igual a 0'),
  body('estimated_days_max').isInt({ min: 0 }).withMessage('Los días máximos deben ser mayor o igual a 0')
    .custom((value, { req }) => {
      if (parseInt(value) < parseInt(req.body.estimated_days_min)) {
        throw new Error('Los días máximos deben ser mayor o igual a los días mínimos');
      }
      return true;
    }),
];

// Routes
router.get('/', getShippingMethods);
router.get('/:id', getShippingMethod);
router.post('/', shippingValidation, validate, createShippingMethod);
router.put('/:id', shippingValidation, validate, updateShippingMethod);
router.delete('/:id', deleteShippingMethod);
router.patch('/:id/toggle-status', toggleShippingMethodStatus);

export default router;
