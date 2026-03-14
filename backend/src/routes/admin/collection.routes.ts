import { Router } from 'express';
import { getCollections, getCollectionById, createCollection, updateCollection, deleteCollection } from '../../controllers/admin/collection.controller.js';
import { verifyToken, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', authorize(['admin', 'manager', 'staff']), getCollections);
router.get('/:id', authorize(['admin', 'manager', 'staff']), getCollectionById);
router.post('/', authorize(['admin', 'manager']), createCollection);
router.put('/:id', authorize(['admin', 'manager']), updateCollection);
router.delete('/:id', authorize(['admin', 'manager']), deleteCollection);

export default router;
