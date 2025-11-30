import express from 'express';
import { body } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus
} from '../../controllers/admin/brands.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate, requireAdmin);

// Validation rules
const brandValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('slug').notEmpty().withMessage('El slug es requerido')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('El slug debe contener solo letras minúsculas, números y guiones'),
  body('website_url').optional().isURL().withMessage('La URL del sitio web no es válida'),
];

// Routes
router.get('/', getBrands);
router.get('/:id', getBrand);
router.post('/', brandValidation, validate, createBrand);
router.put('/:id', brandValidation, validate, updateBrand);
router.delete('/:id', deleteBrand);
router.patch('/:id/toggle-status', toggleBrandStatus);

export default router;
