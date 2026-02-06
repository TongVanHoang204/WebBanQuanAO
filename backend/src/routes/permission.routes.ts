import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware.js';
import { getPermissions, createPermission, updatePermission, deletePermission } from '../controllers/permission.controller.js';

const router = Router();

// Require admin for all permission routes
router.use(verifyToken, requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Access control management (Admin only)
 */

/**
 * @swagger
 * /admin/permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/', getPermissions);
router.post('/', createPermission);
router.put('/:id', updatePermission);
router.delete('/:id', deletePermission);

export default router;
