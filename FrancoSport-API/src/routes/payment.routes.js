import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { uploadSingleImage } from '../middleware/imageUpload.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = express.Router();

// Per-user limit on proof uploads (counted per account, not per IP)
const proofLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `user-${req.user.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Demasiados intentos de subida de comprobantes; intente más tarde',
      },
    }),
});

// Public route to get config
router.get('/config', paymentController.getPaymentConfig);

// Upload proof requires auth; only the order owner, images only
router.post('/proof/:orderId', authenticate, proofLimiter, uploadSingleImage('image'), paymentController.uploadPaymentProof);

export default router;
