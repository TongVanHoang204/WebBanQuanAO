import { Router } from 'express';
import { autocomplete, getPlaceDetails, searchPlaces } from '../controllers/places.controller.js';

const router = Router();

// POST /api/places/autocomplete - Get address suggestions
router.post('/autocomplete', autocomplete);

// GET /api/places/:placeId - Get place details (lat/lng)
router.get('/:placeId', getPlaceDetails);

// POST /api/places/search - Search places by text
router.post('/search', searchPlaces);

export default router;
