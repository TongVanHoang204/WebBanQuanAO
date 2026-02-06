import express from 'express';
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controllers/brand.controller.js';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Brand management
 */

/**
 * @swagger
 * /admin/brands:
 *   get:
 *     summary: Get all brands (Admin)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of brands
 */
router.get('/', authorize(['admin', 'manager', 'staff']), getBrands);

/**
 * @swagger
 * /admin/brands:
 *   post:
 *     summary: Create new brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Brand created
 */
router.get('/:id', authorize(['admin', 'manager', 'staff']), getBrandById);
router.post('/', authorize(['admin', 'manager', 'staff']), createBrand);
router.put('/:id', authorize(['admin', 'manager', 'staff']), updateBrand);
router.delete('/:id', authorize(['admin', 'manager']), deleteBrand);

export default router;
