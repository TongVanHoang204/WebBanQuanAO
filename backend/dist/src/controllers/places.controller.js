import fetch from 'node-fetch';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'google-map-places-new-v2.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;
// Autocomplete - Get address suggestions
export const autocomplete = async (req, res) => {
    try {
        const { input, lat, lng } = req.body;
        if (!input || input.length < 2) {
            return res.status(400).json({ success: false, message: 'Input must be at least 2 characters' });
        }
        const response = await fetch(`${BASE_URL}/v1/places:autocomplete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-FieldMask': '*',
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY
            },
            body: JSON.stringify({
                input: input,
                locationBias: lat && lng ? {
                    circle: {
                        center: { latitude: lat, longitude: lng },
                        radius: 50000 // 50km radius
                    }
                } : {
                    circle: {
                        center: { latitude: 10.8231, longitude: 106.6297 }, // Default: HCM
                        radius: 100000
                    }
                },
                includedRegionCodes: ['VN'], // Vietnam only
                languageCode: 'vi',
                regionCode: 'VN',
                includeQueryPredictions: true
            })
        });
        const data = await response.json();
        // Format response for frontend
        const suggestions = data.suggestions?.map((s) => ({
            placeId: s.placePrediction?.placeId || s.placeId,
            description: s.placePrediction?.text?.text || s.description || '',
            mainText: s.placePrediction?.structuredFormat?.mainText?.text || '',
            secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text || ''
        })).filter((s) => s.placeId) || [];
        res.json({ success: true, data: suggestions });
    }
    catch (error) {
        console.error('Places autocomplete error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get place details (lat/lng, formatted address)
export const getPlaceDetails = async (req, res) => {
    try {
        const { placeId } = req.params;
        if (!placeId) {
            return res.status(400).json({ success: false, message: 'Place ID is required' });
        }
        const response = await fetch(`${BASE_URL}/v1/places/${placeId}`, {
            method: 'GET',
            headers: {
                'X-Goog-FieldMask': 'displayName,formattedAddress,location,addressComponents',
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });
        const data = await response.json();
        // Extract address components
        const addressComponents = data.addressComponents || [];
        const getComponent = (type) => {
            const comp = addressComponents.find((c) => c.types?.includes(type));
            return comp?.longText || comp?.shortText || '';
        };
        res.json({
            success: true,
            data: {
                placeId,
                name: data.displayName?.text || '',
                formattedAddress: data.formattedAddress || '',
                location: {
                    lat: data.location?.latitude || 0,
                    lng: data.location?.longitude || 0
                },
                components: {
                    streetNumber: getComponent('street_number'),
                    route: getComponent('route'),
                    ward: getComponent('sublocality_level_1') || getComponent('sublocality'),
                    district: getComponent('administrative_area_level_2'),
                    province: getComponent('administrative_area_level_1'),
                    country: getComponent('country'),
                    postalCode: getComponent('postal_code')
                }
            }
        });
    }
    catch (error) {
        console.error('Places details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Search places by text
export const searchPlaces = async (req, res) => {
    try {
        const { query, lat, lng } = req.body;
        if (!query) {
            return res.status(400).json({ success: false, message: 'Query is required' });
        }
        const response = await fetch(`${BASE_URL}/v1/places:searchText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY
            },
            body: JSON.stringify({
                textQuery: query,
                languageCode: 'vi',
                regionCode: 'VN',
                maxResultCount: 5,
                locationBias: lat && lng ? {
                    circle: {
                        center: { latitude: lat, longitude: lng },
                        radius: 50000
                    }
                } : undefined
            })
        });
        const data = await response.json();
        const places = data.places?.map((p) => ({
            name: p.displayName?.text || '',
            formattedAddress: p.formattedAddress || '',
            location: {
                lat: p.location?.latitude || 0,
                lng: p.location?.longitude || 0
            }
        })) || [];
        res.json({ success: true, data: places });
    }
    catch (error) {
        console.error('Places search error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
//# sourceMappingURL=places.controller.js.map