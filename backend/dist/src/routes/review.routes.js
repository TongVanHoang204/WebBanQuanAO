import { Router } from 'express';
import { bulkDeleteReviews, bulkUpdateReviewStatus, createReview, deleteReview, getAdminReviews, getProductReviews, updateReviewStatus } from '../controllers/review.controller.js';
import { verifyToken, requireAdmin, optionalAuth } from '../middlewares/auth.middleware.js';
const router = Router();
// Public routes
router.get('/product/:id', optionalAuth, getProductReviews);
// Protected routes (Customer)
router.post('/', verifyToken, createReview);
// Admin routes
router.get('/', verifyToken, requireAdmin, getAdminReviews);
router.patch('/:id/status', verifyToken, requireAdmin, updateReviewStatus);
router.patch('/bulk-status', verifyToken, requireAdmin, bulkUpdateReviewStatus);
router.delete('/bulk', verifyToken, requireAdmin, bulkDeleteReviews);
router.delete('/:id', verifyToken, requireAdmin, deleteReview);
// Backward compatibility for old path/method
router.put('/:id/status', verifyToken, requireAdmin, updateReviewStatus);
router.put('/reviews/:id/status', verifyToken, requireAdmin, updateReviewStatus);
export default router;
//# sourceMappingURL=review.routes.js.map