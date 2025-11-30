/**
 * Product Routes
 * Franco Sport E-Commerce
 */

import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getCategories,
  getBrands,
} from '../controllers/product.controller.js';

const router = express.Router();

/**
 * @route   GET /api/products/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/products/brands
 * @desc    Get all brands
 * @access  Public
 */
router.get('/brands', getBrands);

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 */
router.get('/', getProducts);

/**
 * @route   GET /api/products/:slug
 * @desc    Get single product by slug
 * @access  Public
 */
router.get('/:slug', getProductBySlug);

export default router;
