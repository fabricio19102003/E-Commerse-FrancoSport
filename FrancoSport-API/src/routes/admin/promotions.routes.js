import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import * as promotionsController from '../../controllers/admin/promotions.controller.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', promotionsController.getPromotions);
router.get('/:id', promotionsController.getPromotion);
router.post('/', promotionsController.createPromotion);
router.put('/:id', promotionsController.updatePromotion);
router.delete('/:id', promotionsController.deletePromotion);
router.post('/:id/notify', promotionsController.notifyUsers);

export default router;
