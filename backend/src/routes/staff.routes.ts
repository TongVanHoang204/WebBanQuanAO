import express from 'express';
import {
  getStaffList,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getRoles,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/staff.controller.js';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(authorize(['admin', 'manager']));

// Staff management
/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff & Role management
 */

/**
 * @swagger
 * /admin/staff:
 *   get:
 *     summary: Get staff list
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff
 */
router.get('/', getStaffList);
router.get('/:id', getStaffById);

/**
 * @swagger
 * /admin/staff:
 *   post:
 *     summary: Create new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Staff created
 */
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

// Role management
/**
 * @swagger
 * /admin/staff/roles/list:
 *   get:
 *     summary: Get all roles
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/roles/list', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

export default router;
