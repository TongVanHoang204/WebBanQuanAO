import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface AddressMapProps {
  address: string;
  city: string;
  province: string;
  className?: string;
}

// Component to update map center when coordinates change
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function AddressMap({ address, city, province, className = '' }: AddressMapProps) {
  const [coordinates, setCoordinates] = useState<[number, number]>([21.0285, 105.8542]); // Default: Hanoi
  const [isLoading, setIsLoading] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Need at least city or province to geocode
    if (!city && !province) {
      setHasLocation(false);
      return;
    }

    // Debounce geocoding request
    debounceRef.current = setTimeout(async () => {
      const fullAddress = [address, city, province, 'Vietnam']
        .filter(Boolean)
        .join(', ');

      if (fullAddress.split(',').filter(s => s.trim()).length < 2) {
        return;
      }

      setIsLoading(true);
      try {
        // Using Nominatim OpenStreetMap geocoding (free, no API key needed)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=vn&limit=1`,
          {
            headers: {
              'User-Agent': 'FashionStore/1.0'
            }
          }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setCoordinates([parseFloat(lat), parseFloat(lon)]);
          setHasLocation(true);
        } else {
          // Fallback: try with just city/province
          const fallbackAddress = [city, province, 'Vietnam'].filter(Boolean).join(', ');
          const fallbackResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackAddress)}&countrycodes=vn&limit=1`,
            {
              headers: {
                'User-Agent': 'FashionStore/1.0'
              }
            }
          );
          const fallbackData = await fallbackResponse.json();
          if (fallbackData && fallbackData.length > 0) {
            const { lat, lon } = fallbackData[0];
            setCoordinates([parseFloat(lat), parseFloat(lon)]);
            setHasLocation(true);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 800); // Debounce 800ms

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [address, city, province]);

  // Don't show map if no location data
  if (!city && !province) {
    return null;
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-[1000] flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      )}
      
      <MapContainer
        center={coordinates}
        zoom={hasLocation ? 14 : 6}
        style={{ height: '250px', width: '100%' }}
        scrollWheelZoom={false}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasLocation && <Marker position={coordinates} />}
        <MapUpdater center={coordinates} />
      </MapContainer>

      {hasLocation && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-secondary-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-secondary-600 dark:text-secondary-300 z-[1000]">
          📍 {[address, city, province].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}
