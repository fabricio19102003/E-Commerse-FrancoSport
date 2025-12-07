import express from 'express';
import { getActivePosts } from '../controllers/community.controller.js';

const router = express.Router();

router.get('/', getActivePosts);

export default router;
