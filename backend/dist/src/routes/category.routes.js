import { Router } from 'express';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';
import { getCategories, getCategoryBySlug, getCategoryProducts, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';
const router = Router();
// Public routes
/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */
/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.get('/:slug/products', getCategoryProducts);
/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create category
 *     tags: [Categories]
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
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/', verifyToken, authorize(['admin', 'manager', 'staff']), createCategory);
router.put('/:id', verifyToken, authorize(['admin', 'manager', 'staff']), updateCategory);
router.delete('/:id', verifyToken, authorize(['admin', 'manager']), deleteCategory);
export default router;
//# sourceMappingURL=category.routes.js.map