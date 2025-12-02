import express from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { upload } from '../../config/cloudinary.js';
import * as paymentController from '../../controllers/admin/payment.controller.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.put('/config', upload.single('qr_code'), paymentController.updatePaymentConfig);
router.post('/approve/:orderId', paymentController.approvePayment);

export default router;
