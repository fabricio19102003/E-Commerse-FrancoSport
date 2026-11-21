/**
 * Upload Routes
 * Franco Sport API
 *
 * Generic uploads are admin only. Customers upload through their own
 * endpoint (payment proof: POST /api/payment/proof/:orderId).
 */

import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadSingleImage, uploadImages } from '../middleware/imageUpload.js';
import * as uploadController from '../controllers/upload.controller.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

// POST /api/upload/image - Upload single image
router.post('/image', uploadSingleImage('image'), uploadController.uploadImage);

// POST /api/upload/images - Upload multiple images
router.post('/images', uploadImages('images', 5), uploadController.uploadMultipleImages);

// DELETE /api/upload/image/<public id> - Delete image (public ids contain slashes, e.g. franco-sport/products/x)
router.delete('/image/*', uploadController.deleteImage);

export default router;
