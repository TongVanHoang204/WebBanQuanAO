import express from 'express';
import {
  getReviews,
  getReviewById,
  updateReviewStatus,
  bulkUpdateStatus,
  deleteReview,
  bulkDeleteReviews,
  getPublicReviews,
  createReview
} from '../controllers/review.controller.js';
import { verifyToken, optionalAuth, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews management
 */

/**
 * @swagger
 * /reviews/product/{id}:
 *   get:
 *     summary: Get product reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/product/:id', getPublicReviews);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create new review
 *     tags: [Reviews]
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
router.post('/', optionalAuth, createReview);

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
