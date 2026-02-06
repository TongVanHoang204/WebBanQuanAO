import express from 'express';
import { getShippingMethods, getShippingMethodById, createShippingMethod, updateShippingMethod, deleteShippingMethod, calculateShippingFee } from '../controllers/shipping.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
const router = express.Router();
// Public route - calculate shipping fee
/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: Shipping method management
 */
/**
 * @swagger
 * /admin/shipping/calculate:
 *   post:
 *     summary: Calculate shipping fee
 *     tags: [Shipping]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipping fee
 */
router.post('/calculate', calculateShippingFee);
// Admin routes - require authentication
router.use(verifyToken);
/**
 * @swagger
 * /admin/shipping:
 *   get:
 *     summary: Get all shipping methods
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shipping methods
 */
router.get('/', getShippingMethods);
router.get('/:id', getShippingMethodById);
/**
 * @swagger
 * /admin/shipping:
 *   post:
 *     summary: Create shipping method
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               fee:
 *                 type: number
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', createShippingMethod);
router.put('/:id', updateShippingMethod);
router.delete('/:id', deleteShippingMethod);
export default router;
//# sourceMappingURL=shipping.routes.js.map