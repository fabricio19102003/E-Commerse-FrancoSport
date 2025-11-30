import express from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import {
  getReviews,
  getReview,
  approveReview,
  deleteReview
} from '../../controllers/admin/reviews.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate, requireAdmin);

// Routes
router.get('/', getReviews);
router.get('/:id', getReview);
router.patch('/:id/approve', approveReview);
router.delete('/:id', deleteReview);

export default router;
