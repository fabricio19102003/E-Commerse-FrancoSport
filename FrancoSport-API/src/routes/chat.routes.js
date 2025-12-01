import express from 'express';
import { authenticate, requireModerator } from '../middleware/auth.js';
import { getMyHistory, getConversations, getUserHistory } from '../controllers/chat.controller.js';

const router = express.Router();

// User routes
router.get('/my-history', authenticate, getMyHistory);

// Admin routes
router.get('/conversations', authenticate, requireModerator, getConversations);
router.get('/user/:userId', authenticate, requireModerator, getUserHistory);

export default router;
