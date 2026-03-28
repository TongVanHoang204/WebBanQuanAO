import express from 'express';
import { getLogs, getLogStats, exportLogs, deleteLog, bulkDeleteLogs, deleteOldLogs, rollbackLog } from '../../controllers/admin/log.controller.js';
import { verifyToken, authorize } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

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
router.get('/stats', authorize(['admin', 'manager']), getLogStats);

router.delete('/:id', authorize(['admin']), deleteLog);
router.post('/bulk-delete', authorize(['admin']), bulkDeleteLogs);
router.post('/delete-old', authorize(['admin']), deleteOldLogs);
router.post('/:id/rollback', authorize(['admin']), rollbackLog);

/**
 * @swagger
 * /admin/logs/export:
 *   get:
 *     summary: Export activity logs as CSV
 *     tags: [Logs]
 */
router.get('/export', authorize(['admin', 'manager']), exportLogs);

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
router.get('/', authorize(['admin', 'manager']), getLogs);

export default router;
