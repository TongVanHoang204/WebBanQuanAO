import express from 'express';
import { chatWithAI, generateContent } from '../controllers/ai.controller.js';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all AI routes
// The global verifyToken middleware is being replaced by route-specific middleware.
// router.use(verifyToken); // This line is commented out as per the change.

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI Assistant capabilities
 */

/**
 * @swagger
 * /admin/ai/chat:
 *   post:
 *     summary: Chat with AI Assistant (Internal)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/chat', verifyToken, chatWithAI);
router.post('/generate', verifyToken, authorize(['admin', 'manager', 'staff']), generateContent);

export default router;
