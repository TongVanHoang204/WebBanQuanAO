import { Router } from 'express';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';
import { updateOrderStatus, getOrderById } from '../controllers/order.controller.js';
import { createProduct, updateProduct, deleteProduct, getDashboardStats, createCategory, updateCategory, deleteCategory, getUsers, getUserById, createUser, updateUser, deleteUser, getAnalytics, getAdminProducts, getAdminOrders, } from '../controllers/admin.controller.js';
import { getProductById } from '../controllers/product.controller.js';
const router = Router();
// Authentication required for all admin routes
router.use(verifyToken);
/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative functions
 */
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', authorize(['admin', 'manager', 'staff']), getDashboardStats);
// Products Management
/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get all products (Admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products with admin details
 */
const productRoles = ['admin', 'manager', 'staff'];
router.get('/products', authorize(productRoles), getAdminProducts);
/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Create new product
 *     tags: [Admin]
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
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/products', authorize(productRoles), createProduct);
router.get('/products/:id', authorize(productRoles), getProductById);
router.put('/products/:id', authorize(productRoles), updateProduct);
router.delete('/products/:id', authorize(['admin', 'manager']), deleteProduct);
// Orders Management
/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders (Admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
const orderRoles = ['admin', 'manager', 'staff'];
router.get('/orders', authorize(orderRoles), getAdminOrders);
router.get('/orders/:id', authorize(orderRoles), getOrderById);
router.put('/orders/:id/status', authorize(orderRoles), updateOrderStatus);
// Categories Management
router.post('/categories', authorize(productRoles), createCategory);
router.put('/categories/:id', authorize(productRoles), updateCategory);
router.delete('/categories/:id', authorize(['admin', 'manager']), deleteCategory);
// Users Management
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', authorize(['admin', 'manager', 'staff']), getUsers);
router.get('/users/:id', authorize(['admin', 'manager', 'staff']), getUserById);
// Creating/Modifying Users (Staff Management implicitly or Customer moderation)
// User requirement: "Quan ly doi ngu" -> Manager. 
// We reserve Create/Update/Delete user for Manager/Admin
const userMgmtRoles = ['admin', 'manager'];
router.post('/users', authorize(userMgmtRoles), createUser);
router.put('/users/:id', authorize(userMgmtRoles), updateUser);
router.delete('/users/:id', authorize(userMgmtRoles), deleteUser);
// Analytics & Reports
// "Xem bao cao doanh thu tong" -> Manager/Admin only
router.get('/analytics', authorize(['admin', 'manager']), getAnalytics);
export default router;
//# sourceMappingURL=admin.routes.js.map