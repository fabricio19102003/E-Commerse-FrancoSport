/**
 * Admin Products Routes
 * Franco Sport API
 */

import express from 'express';
import { body } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as productsController from '../../controllers/admin/products.controller.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate, requireAdmin);

// GET /api/admin/products - Get all products
router.get('/', productsController.getProducts);

// GET /api/admin/products/low-stock - Get low stock products
router.get('/low-stock', productsController.getLowStockProducts);

// GET /api/admin/products/:id - Get single product
router.get('/:id', productsController.getProduct);

// POST /api/admin/products - Create product
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('slug').trim().isLength({ min: 3 }).withMessage('El slug debe tener al menos 3 caracteres'),
    body('description').trim().isLength({ min: 10 }).withMessage('La descripción debe tener al menos 10 caracteres'),
    body('price').isFloat({ min: 0 }).withMessage('El precio debe ser mayor a 0'),
    body('cost_price').isFloat({ min: 0 }).withMessage('El costo debe ser mayor a 0'),
    body('sku').trim().notEmpty().withMessage('El SKU es requerido'),
    body('stock').isInt({ min: 0 }).withMessage('El stock no puede ser negativo'),
    body('low_stock_threshold').isInt({ min: 0 }).withMessage('El umbral debe ser mayor a 0'),
    body('weight').isFloat({ min: 0 }).withMessage('El peso debe ser mayor a 0'),
    body('category_id').isInt({ min: 1 }).withMessage('Selecciona una categoría'),
    body('brand_id').isInt({ min: 1 }).withMessage('Selecciona una marca'),
    validate,
  ],
  productsController.createProduct
);

// PUT /api/admin/products/:id - Update product
router.put('/:id', productsController.updateProduct);

// DELETE /api/admin/products/:id - Delete product
router.delete('/:id', productsController.deleteProduct);

// PATCH /api/admin/products/:id/toggle-status - Toggle active status
router.patch('/:id/toggle-status', productsController.toggleProductStatus);

export default router;
