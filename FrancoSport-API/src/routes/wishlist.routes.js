import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist
} from '../controllers/wishlist.controller.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticate);

router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/', getWishlist);

export default router;
