import { Router } from 'express';
import { checkout, getOrders, getOrderById, getOrderByCode, cancelOrder } from '../controllers/order.controller.js';
import { verifyToken, optionalAuth } from '../middlewares/auth.middleware.js';
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order processing & management
 */
/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_name:
 *                 type: string
 *               payment_method:
 *                 type: string
 *                 enum: [cod, bank_transfer, momo, vnpay]
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/checkout', optionalAuth, checkout);
/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', verifyToken, getOrders);
router.get('/code/:code', getOrderByCode);
router.get('/:id', optionalAuth, getOrderById);
router.post('/:id/cancel', verifyToken, cancelOrder);
export default router;
//# sourceMappingURL=order.routes.js.map