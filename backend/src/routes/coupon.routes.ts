import { Router } from 'express';
import { getCoupons, getCoupon, createCoupon, updateCoupon, deleteCoupon, applyCoupon } from '../controllers/coupon.controller.js';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Discount coupon management
 */

/**
 * @swagger
 * /admin/coupons/apply:
 *   post:
 *     summary: Apply coupon to cart
 *     tags: [Coupons]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               cartTotal:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coupon applied
 */
router.post('/apply', applyCoupon);

router.use(verifyToken);
router.use(authorize(['admin', 'manager']));

/**
 * @swagger
 * /admin/coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons
 */
router.get('/', getCoupons);
router.get('/:id', getCoupon);

/**
 * @swagger
 * /admin/coupons:
 *   post:
 *     summary: Create new coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discount_type:
 *                 type: string
 *                 enum: [fixed, percentage]
 *               discount_value:
 *                 type: number
 *     responses:
 *       201:
 *         description: Coupon created
 */
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;
