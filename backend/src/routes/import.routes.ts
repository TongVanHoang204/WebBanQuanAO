import express from 'express';
import multer from 'multer';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';
import { importProducts, downloadProductTemplate } from '../controllers/import.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Import
 *   description: Import products from Excel
 */

/**
 * @swagger
 * /admin/import/products/template:
 *   get:
 *     summary: Download import template
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel template file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /admin/import/products:
 *   post:
 *     summary: Import products from Excel file
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx or .xls)
 *     responses:
 *       200:
 *         description: Import result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: integer
 *                     successCount:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 */

// Multer config for Excel files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel' // xls
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
  }
});

// Download import template
router.get('/products/template', verifyToken, authorize(['admin', 'staff']), downloadProductTemplate);

// Import products from Excel
router.post('/products', verifyToken, authorize(['admin', 'staff']), upload.single('file'), importProducts);

export default router;
