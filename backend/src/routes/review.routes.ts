import express from 'express';
import {
  getReviews,
  getReviewById,
  updateReviewStatus,
  bulkUpdateStatus,
  deleteReview,
  bulkDeleteReviews,
  getPublicReviews,
  createReview,
  markHelpful,
  unmarkHelpful
} from '../controllers/review.controller.js';
import { verifyToken, optionalAuth, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public route to view
router.get('/product/:id', optionalAuth, getPublicReviews);

// Like/Unlike review (Require login)
router.post('/:id/helpful', verifyToken, markHelpful);
router.delete('/:id/helpful', verifyToken, unmarkHelpful);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create new review (Requires login and purchase)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 */
router.post('/', verifyToken, createReview);

// All admin routes require authentication
router.use(verifyToken);
router.use(authorize(['admin', 'manager', 'staff']));

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     summary: Get all reviews (Admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/', getReviews);
router.get('/:id', getReviewById);
router.patch('/bulk-status', bulkUpdateStatus);
router.patch('/:id/status', updateReviewStatus);
router.delete('/bulk', bulkDeleteReviews);
router.delete('/:id', deleteReview);

export default router;
