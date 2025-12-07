import express from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { upload } from '../../config/cloudinary.js';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} from '../../controllers/admin/community.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', upload.single('image'), createPost);
router.put('/:id', upload.single('image'), updatePost);
router.delete('/:id', deletePost);

export default router;
