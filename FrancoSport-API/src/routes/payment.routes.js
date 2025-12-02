import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = express.Router();

// Public route to get config
router.get('/config', paymentController.getPaymentConfig);

// Upload proof requires auth
router.post('/proof/:orderId', authenticate, upload.single('image'), paymentController.uploadPaymentProof);

export default router;
