import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createReview, getProductReviews } from '../controllers/review.controller.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/', authenticate, createReview);

export default router;
