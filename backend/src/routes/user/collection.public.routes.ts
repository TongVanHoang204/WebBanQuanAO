import { Router } from 'express';
import { getFeaturedCollections, getPublicCollectionBySlug } from '../../controllers/user/collection.public.controller.js';

const router = Router();

router.get('/', getFeaturedCollections);
router.get('/:slug', getPublicCollectionBySlug);

export default router;
