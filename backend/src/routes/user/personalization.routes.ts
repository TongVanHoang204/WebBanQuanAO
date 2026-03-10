import { Router } from 'express';
import { trackView, getRecommendedProducts } from '../../controllers/user/personalization.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// Protected tracking routes
router.post('/track/view', verifyToken, trackView);
router.get('/recommendations', verifyToken, getRecommendedProducts);

export default router;
