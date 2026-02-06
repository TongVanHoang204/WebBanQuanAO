import express from 'express';
import { getLogs } from '../controllers/log.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

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
