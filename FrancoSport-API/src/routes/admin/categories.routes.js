import express from 'express';
import { body } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from '../../controllers/admin/categories.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate, requireAdmin);

// Validation rules
const categoryValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('slug').notEmpty().withMessage('El slug es requerido')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('El slug debe contener solo letras minúsculas, números y guiones'),
];

// Routes
router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', categoryValidation, validate, createCategory);
router.put('/:id', categoryValidation, validate, updateCategory);
router.delete('/:id', deleteCategory);
router.patch('/:id/toggle-status', toggleCategoryStatus);

export default router;
