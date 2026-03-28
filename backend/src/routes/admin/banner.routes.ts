import express from 'express';
import {
  getBanners,
  getPublicBanners,
  getBannerById,
  createBanner,
  updateBanner,
  reorderBanners,
  deleteBanner
} from '../../controllers/admin/banner.controller.js';
import { verifyToken, authorize } from '../../middlewares/auth.middleware.js';

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
router.get('/', authorize(['admin', 'manager', 'staff']), getBanners);

router.get('/:id', authorize(['admin', 'manager', 'staff']), getBannerById);

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
router.post('/', authorize(['admin', 'manager']), createBanner);
router.patch('/reorder', authorize(['admin', 'manager']), reorderBanners);
router.put('/:id', authorize(['admin', 'manager']), updateBanner);
router.delete('/:id', authorize(['admin', 'manager']), deleteBanner);

export default router;
