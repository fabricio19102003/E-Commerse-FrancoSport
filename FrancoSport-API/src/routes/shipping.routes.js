/**
 * Shipping Routes (public)
 * Franco Sport E-Commerce
 */

import express from 'express';
import { getShippingMethods } from '../controllers/shipping.controller.js';

const router = express.Router();

/**
 * @route   GET /api/shipping-methods
 * @desc    Get active shipping methods (active zones only)
 * @access  Public
 */
router.get('/', getShippingMethods);

export default router;
