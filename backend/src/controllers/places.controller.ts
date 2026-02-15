import { Request, Response } from 'express';
import fetch from 'node-fetch';

const GOONG_BASE_URL = 'https://rsapi.goong.io';

// Autocomplete - Get address suggestions using Goong API
export const autocomplete = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    const input = req.body.input || req.body.query;
    const apiKey = process.env.GOONG_API_KEY || '';

    if (!input || input.length < 2) {
      return res.status(400).json({ success: false, message: 'Input must be at least 2 characters' });
    }

    let url = `${GOONG_BASE_URL}/Place/AutoComplete?api_key=${apiKey}&input=${encodeURIComponent(input)}`;
    if (lat && lng) {
      url += `&location=${lat},${lng}&radius=50`; // 50km radius bias
    }

    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.status !== 'OK' && data.predictions === undefined) {
         throw new Error(data.error_message || 'Goong API Error');
    }
    
    // Format response for frontend to match previous Google Places structure
    const suggestions = (data.predictions || []).map((s: any) => ({
      placeId: s.place_id,
      description: s.description,
      mainText: s.structured_formatting.main_text,
      secondaryText: s.structured_formatting.secondary_text
    }));

    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    console.error('Goong places autocomplete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get place details (lat/lng, formatted address) using Goong API
export const getPlaceDetails = async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;
    const apiKey = process.env.GOONG_API_KEY || '';

    if (!placeId) {
      return res.status(400).json({ success: false, message: 'Place ID is required' });
    }

    const url = `${GOONG_BASE_URL}/Place/Detail?api_key=${apiKey}&place_id=${placeId}`;
    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.status !== 'OK' && data.result === undefined) {
         throw new Error(data.error_message || 'Goong API Error');
    }

    const result = data.result;

    // Extract address components (Goong structure differs slightly but similar concept)
    // Goong doesn't return nice address_components array in Detail API usually, mostly compound address.
    // However, if it does, we map it best effort.
    // Usually rely on formatted_address and name.

    res.json({
      success: true,
      data: {
        placeId,
        name: result.name || '',
        formattedAddress: result.formatted_address || '',
        location: {
          lat: result.geometry?.location?.lat || 0,
          lng: result.geometry?.location?.lng || 0
        },
        // Goong might not provide detailed components in all tiers, pass what's available
        // Frontend will use string matching for mapping if components missing
        components: {
            province: result.compound?.province || '',
            district: result.compound?.district || '',
            ward: result.compound?.commune || ''
        }
      }
    });
  } catch (error: any) {
    console.error('Goong places details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search places by text - Reusing Autocomplete for basic text search in Goong
export const searchPlaces = async (req: Request, res: Response) => {
    // Goong doesn't have a distinct "Text Search" like Google. 
    // Autocomplete is the primary search method.
    // For specific nearby search we could use /Place/Search but Autocomplete is usually enough for this UI.
    return autocomplete(req, res);
};
