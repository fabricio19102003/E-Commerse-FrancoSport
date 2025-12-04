import { Router } from 'express';
import * as promotionsController from '../controllers/promotions.controller.js';

const router = Router();

router.get('/active', promotionsController.getActivePromotions);
router.get('/:id', promotionsController.getPromotionById);

export default router;
