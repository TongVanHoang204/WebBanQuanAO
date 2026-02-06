import express from 'express';
import {
  exportOrders,
  exportProducts,
  exportCustomers,
  exportRevenue
} from '../controllers/export.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/admin/export/orders
/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Data export (Excel/CSV)
 */

/**
 * @swagger
 * /admin/export/orders:
 *   get:
 *     summary: Export orders to Excel
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file download
 */
router.get('/orders', exportOrders);
router.get('/products', exportProducts);
router.get('/customers', exportCustomers);
router.get('/revenue', exportRevenue);

export default router;
