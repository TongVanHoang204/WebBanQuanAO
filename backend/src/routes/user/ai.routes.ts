import express from 'express';
import { chatWithAI, generateContent, visualSearch } from '../../controllers/user/ai.controller.js';
import { verifyToken, authorize } from '../../middlewares/auth.middleware.js';
import { rateLimit } from '../../middlewares/rate-limit.middleware.js';

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
 *     description: |
 *       Requires admin/manager/staff role.
 *       Rate limited: 20 requests per minute per user.
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
// Rate limit: 20 AI chat requests per minute, 10 content generation per minute
router.post('/chat', verifyToken, authorize(['admin']), rateLimit('ai-chat', 20, 60_000), chatWithAI);
router.post('/generate', verifyToken, authorize(['admin', 'manager', 'staff']), rateLimit('ai-generate', 10, 60_000), generateContent);
router.post('/visual-search', verifyToken, rateLimit('ai-vision', 5, 60_000), visualSearch);

export default router;
