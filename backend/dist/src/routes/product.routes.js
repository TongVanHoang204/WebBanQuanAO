import { Router } from 'express';
import { getProducts, getProductBySlug, getProductById, getNewArrivals, searchProducts } from '../controllers/product.controller.js';
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management API
 */
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', getProducts);
/**
 * @swagger
 * /products/new-arrivals:
 *   get:
 *     summary: Get new arrivals
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of newest products
 */
router.get('/new-arrivals', getNewArrivals);
/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Search products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', searchProducts);
/**
 * @swagger
 * /products/id/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/id/:id', getProductById);
/**
 * @swagger
 * /products/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product URL slug
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:slug', getProductBySlug);
export default router;
//# sourceMappingURL=product.routes.js.map