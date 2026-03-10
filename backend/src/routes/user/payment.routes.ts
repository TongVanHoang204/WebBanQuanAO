import express from 'express';
import { createPaymentUrl, vnpayReturn, vnpayIpn, getTransactions } from '../../controllers/user/payment.controller.js';
import { handleBankWebhook, verifyWebhookSignature } from '../../controllers/user/payment-webhook.controller.js';
import { verifyToken, authorize } from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment styling and webhook handling
 */

/**
 * @swagger
 * /payment/create_url:
 *   post:
 *     summary: Create VNPay payment URL
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               bankCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment URL generated
 */
router.post('/create_url', verifyToken, createPaymentUrl);
router.get('/vnpay_return', vnpayReturn);
router.get('/vnpay_ipn', vnpayIpn);

/**
 * @swagger
 * /payment/transactions:
 *   get:
 *     summary: Get payment transactions
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/transactions', verifyToken, authorize(['admin', 'manager']), getTransactions);

// Bank Transfer Webhook (Casso/Sepay) - with HMAC signature verification
router.post('/webhook/bank', verifyWebhookSignature, handleBankWebhook);

export default router;
