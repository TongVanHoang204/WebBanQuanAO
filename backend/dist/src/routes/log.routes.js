import express from 'express';
import { getLogs, getLogStats, exportLogs } from '../controllers/log.controller.js';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';
const router = express.Router();
router.use(verifyToken);
router.use(authorize(['admin', 'manager']));
/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Activity logs
 */
/**
 * @swagger
 * /admin/logs/stats:
 *   get:
 *     summary: Get activity log statistics
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', getLogStats);
/**
 * @swagger
 * /admin/logs/export:
 *   get:
 *     summary: Export activity logs as CSV
 *     tags: [Logs]
 */
router.get('/export', exportLogs);
/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Get system logs
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of logs
 */
router.get('/', getLogs);
export default router;
//# sourceMappingURL=log.routes.js.map