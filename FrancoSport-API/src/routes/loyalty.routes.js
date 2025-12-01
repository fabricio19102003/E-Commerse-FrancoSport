import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getPointsHistory } from '../controllers/loyalty.controller.js';

const router = express.Router();

router.get('/history', authenticate, getPointsHistory);

export default router;
