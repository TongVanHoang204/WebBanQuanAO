import { Router } from 'express';
import { getInventory, getMovements, createMovement } from '../../controllers/admin/inventory.controller.js';
import { authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

// We already come from /api/admin/inventory so those paths are relative to that
router.get('/', authorize(['admin', 'manager', 'staff']), getInventory);
router.get('/movements', authorize(['admin', 'manager', 'staff']), getMovements);
router.post('/movements', authorize(['admin', 'manager']), createMovement);

export default router;
