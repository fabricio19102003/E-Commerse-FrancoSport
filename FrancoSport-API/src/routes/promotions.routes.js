import { Router } from 'express';
import * as promotionsController from '../controllers/promotions.controller.js';

const router = Router();

router.get('/active', promotionsController.getActivePromotion);

export default router;
