import express from 'express';
import {
  exportOrders,
  exportProducts,
  exportCustomers,
  exportRevenue
} from '../../controllers/admin/export.controller.js';
import { verifyToken, authorize } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication + admin/manager role
router.use(verifyToken);
router.use(authorize(['admin', 'manager']));

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
