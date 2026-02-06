import express from 'express';
import {
  getBanners,
  getPublicBanners,
  getBannerById,
  createBanner,
  updateBanner,
  reorderBanners,
  deleteBanner
} from '../controllers/banner.controller.js';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Homepage banner management
 */

/**
 * @swagger
 * /admin/banners/public:
 *   get:
 *     summary: Get active banners (Public)
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of active banners
 */
router.get('/public', getPublicBanners);

// Admin routes - require authentication
router.use(verifyToken);
router.use(authorize(['admin', 'manager', 'staff']));

/**
 * @swagger
 * /admin/banners:
 *   get:
 *     summary: Get all banners (Admin)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of banners
 */
router.get('/', getBanners);

router.get('/:id', getBannerById);

/**
 * @swagger
 * /admin/banners:
 *   post:
 *     summary: Create banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Banner created
 */
router.post('/', createBanner);
router.patch('/reorder', reorderBanners);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);

export default router;
