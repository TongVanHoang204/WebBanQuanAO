import { Router } from 'express';
import { autocomplete, getPlaceDetails, searchPlaces } from '../controllers/places.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Places
 *   description: Google Places API Proxy
 */

/**
 * @swagger
 * /places/autocomplete:
 *   post:
 *     summary: Get address autocomplete suggestions
 *     tags: [Places]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: string
 *                 description: Address text to search
 *     responses:
 *       200:
 *         description: List of suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   description:
 *                     type: string
 *                   place_id:
 *                     type: string
 */

/**
 * @swagger
 * /places/{placeId}:
 *   get:
 *     summary: Get place details (coordinates)
 *     tags: [Places]
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Google Place ID
 *     responses:
 *       200:
 *         description: Place details including location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                 location:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 */

/**
 * @swagger
 * /places/search:
 *   post:
 *     summary: Search for places by query
 *     tags: [Places]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */

// POST /api/places/autocomplete - Get address suggestions
router.post('/autocomplete', autocomplete);

// GET /api/places/:placeId - Get place details (lat/lng)
router.get('/:placeId', getPlaceDetails);

// POST /api/places/search - Search places by text
router.post('/search', searchPlaces);

export default router;
