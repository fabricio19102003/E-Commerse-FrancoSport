/**
 * Upload Routes
 * Franco Sport API
 */

import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import * as uploadController from '../controllers/upload.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// POST /api/upload/image - Upload single image
router.post('/image', upload.single('image'), uploadController.uploadImage);

// POST /api/upload/images - Upload multiple images
router.post('/images', upload.array('images', 5), uploadController.uploadMultipleImages);

// DELETE /api/upload/image/:publicId - Delete image
router.delete('/image/:publicId', uploadController.deleteImage);

export default router;
