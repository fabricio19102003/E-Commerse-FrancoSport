import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscribe, getVapidKey } from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/vapid-key', getVapidKey);
router.post('/subscribe', authenticate, subscribe);

export default router;
