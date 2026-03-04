import { Router } from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeCartItem,
  clearCart,
  mergeCart
} from '../controllers/cart.controller.js';
import { verifyToken, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get user cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     description: Uses optional auth - works for both guests (session-based) and logged-in users.
 *     responses:
 *       200:
 *         description: Cart details
 */
router.get('/', optionalAuth, getCart);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     description: Uses optional auth - supports guest carts.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variant_id:
 *                 type: integer
 *               qty:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added
 */
router.post('/add', optionalAuth, addToCart);
router.put('/update/:itemId', optionalAuth, updateCartItem);
router.delete('/remove/:itemId', optionalAuth, removeCartItem);
router.delete('/clear', optionalAuth, clearCart);
router.post('/merge', verifyToken, mergeCart);

export default router;
