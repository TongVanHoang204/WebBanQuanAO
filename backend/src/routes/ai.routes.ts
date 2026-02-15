import express from 'express';
import { 
  chatWithAI, generateContent,
  analyzeDashboard, analyzeReviews, analyzeAnalytics, suggestCoupon,
  analyzeCustomers, analyzeOrder, analyzeLogs, generateBannerCopy,
  analyzeStaff, generateProductContent
} from '../controllers/ai.controller.js';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

const adminAuth = [verifyToken, authorize(['admin', 'manager', 'staff'])];

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI Assistant capabilities
 */

// Existing routes
router.post('/chat', verifyToken, chatWithAI);
router.post('/generate', ...adminAuth, generateContent);

// New AI analysis routes
router.post('/dashboard-insight', ...adminAuth, analyzeDashboard);
router.post('/review-analyze', ...adminAuth, analyzeReviews);
router.post('/analytics-narrative', ...adminAuth, analyzeAnalytics);
router.post('/coupon-suggest', ...adminAuth, suggestCoupon);
router.post('/customer-analyze', ...adminAuth, analyzeCustomers);
router.post('/order-analyze', ...adminAuth, analyzeOrder);
router.post('/log-analyze', ...adminAuth, analyzeLogs);
router.post('/banner-copy', ...adminAuth, generateBannerCopy);
router.post('/staff-analyze', ...adminAuth, analyzeStaff);
router.post('/product-content', ...adminAuth, generateProductContent);

export default router;
