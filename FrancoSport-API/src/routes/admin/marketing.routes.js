import express from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { upload } from '../../config/cloudinary.js';
import * as marketingController from '../../controllers/marketing.controller.js';

const router = express.Router();

router.post('/send', authenticate, requireAdmin, upload.single('image'), marketingController.sendMarketingEmail);

export default router;
