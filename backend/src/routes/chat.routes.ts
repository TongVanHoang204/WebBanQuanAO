import { Router } from 'express';
import { chat, checkAIHealth } from '../controllers/chat.controller.js';

const router = Router();

import { optionalAuth } from '../middlewares/auth.middleware.js';

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Customer support chat
 */

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Send chat message
 *     tags: [Chat]
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
 *         description: Message sent
 */
router.post('/', optionalAuth, chat);
router.get('/health', checkAIHealth);

export default router;
