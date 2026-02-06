import { Router } from 'express';
import { upload, uploadSingle, uploadMultiple, deleteFile } from '../controllers/upload.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload helper
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload single file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded
 */
router.post('/', verifyToken, upload.single('file'), uploadSingle);
router.post('/multiple', verifyToken, upload.array('files', 10), uploadMultiple);
router.delete('/:filename', verifyToken, deleteFile);

export default router;
