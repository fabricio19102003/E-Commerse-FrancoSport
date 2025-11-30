/**
 * Cart Routes
 * Franco Sport E-Commerce
 */

import express from 'express';
import { body } from 'express-validator';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', getCart);

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
  '/items',
  [
    body('product_id').isInt().withMessage('ID de producto inválido'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La cantidad debe ser al menos 1'),
    validate,
  ],
  addToCart
);

/**
 * @route   PUT /api/cart/items/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put(
  '/items/:itemId',
  [
    body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
    validate,
  ],
  updateCartItem
);

/**
 * @route   DELETE /api/cart/items/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/items/:itemId', removeFromCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear cart
 * @access  Private
 */
router.delete('/', clearCart);

export default router;
