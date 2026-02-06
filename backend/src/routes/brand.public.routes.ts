import express from 'express';
import { getBrands, getBrandById } from '../controllers/brand.controller.js';

const router = express.Router();

// GET /api/brands - List all brands (Public)
// Frontend should pass ?status=active to filter only active brands
/**
 * @swagger
 * /brands:
 *   get:
 *     summary: Get all brands (Public)
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active]
 *     responses:
 *       200:
 *         description: List of public brands
 */
router.get('/', getBrands);
router.get('/:id', getBrandById);

export default router;
