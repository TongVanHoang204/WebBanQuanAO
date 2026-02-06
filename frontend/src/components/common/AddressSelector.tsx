import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, Search, MapPin } from 'lucide-react';
import { placesAPI } from '../../services/api';

interface AddressSelectorProps {
  province?: string;
  district?: string;
  ward?: string;
  onChange: (data: { province: string; district: string; ward: string; address: string }) => void;
}

interface Location {
  code: number;
  name: string;
  division_type?: string;
  codename?: string;
  phone_code?: number;
  districts?: Location[];
  wards?: Location[];
}

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

// Fix Leaflet Marker Icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom red marker for better visibility
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to update map - NO animation for faster response
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, zoom); // setView instead of flyTo for instant update
    }
  }, [center, zoom, map]);
  return null;
}

// Component to handle map clicks and marker positioning
function LocationMarker({ 
    position, 
    setPosition,
    onLocationFound 
}: { 
    position: [number, number], 
    setPosition: (pos: [number, number]) => void,
    onLocationFound: (address: string) => void
}) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      // Skip reverse geocoding on click for faster response
      // Just update marker position immediately
    },
    locationfound(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.setView(e.latlng, 18);
    },
  });

  return position[0] !== 0 ? (
    <Marker position={position} icon={redIcon}>
      <Popup>
        <div className="text-center">
          <strong>📍 Vị trí giao hàng</strong>
          <p className="text-xs mt-1">Lat: {position[0].toFixed(6)}<br/>Lng: {position[1].toFixed(6)}</p>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

export default function AddressSelector({ province = '', district = '', ward = '', specificAddress = '', onChange }: AddressSelectorProps & { specificAddress?: string }) {
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [wards, setWards] = useState<Location[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  
  const [loadingProv, setLoadingProv] = useState(false);

  // Map State
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.8231, 106.6297]); // Default HCM
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([10.8231, 106.6297]);
  const [mapZoom, setMapZoom] = useState(14);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Google Places Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
        setLoadingProv(true);
        try {
            const res = await axios.get('https://provinces.open-api.vn/api/?depth=1');
            if (res.data && Array.isArray(res.data) && isMounted) {
                setProvinces(res.data);
                
                // Sync initial data if provided
                if (province) {
                    const foundProv = res.data.find((p: Location) => p.name === province || p.name.includes(province));
                    if (foundProv) {
                         setSelectedProvince(foundProv.name);
                         
                         // Fetch districts
                         const resDist = await axios.get(`https://provinces.open-api.vn/api/p/${foundProv.code}?depth=2`);
                         if (resDist.data && resDist.data.districts && isMounted) {
                             setDistricts(resDist.data.districts);
                             
                             if (district) {
                                 const foundDist = resDist.data.districts.find((d: Location) => d.name === district || d.name.includes(district));
                                 if (foundDist) {
                                     setSelectedDistrict(foundDist.name);
                                     
                                     // Fetch wards
                                     const resWard = await axios.get(`https://provinces.open-api.vn/api/d/${foundDist.code}?depth=2`);
                                     if (resWard.data && resWard.data.wards && isMounted) {
                                         setWards(resWard.data.wards);
                                         if (ward) setSelectedWard(ward);
                                     }
                                 }
                             }
                         }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch address data", error);
        } finally {
            if (isMounted) setLoadingProv(false);
        }
    };

    fetchData();

    return () => { isMounted = false; };
  }, []);

  // Google Places Autocomplete Handler
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await placesAPI.autocomplete(value, mapCenter[0], mapCenter[1]);
        if (res.data.success) {
          setSuggestions(res.data.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Autocomplete failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Handle selection of a place from suggestions
  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    setShowSuggestions(false);
    setSearchQuery(suggestion.description);
    setIsLoadingMap(true);
    
    try {
      const res = await placesAPI.getDetails(suggestion.placeId);
      if (res.data.success) {
        const { location, components } = res.data.data;
        
        // Update map position
        const newPos: [number, number] = [location.lat, location.lng];
        setMapCenter(newPos);
        setMarkerPosition(newPos);
        setMapZoom(17);
        
        // Try to fill province/district from components
        if (components.province) {
          const foundProv = provinces.find(p => 
            p.name.includes(components.province) || components.province.includes(p.name)
          );
          if (foundProv) {
            setSelectedProvince(foundProv.name);
            // Fetch districts
            const resDist = await axios.get(`https://provinces.open-api.vn/api/p/${foundProv.code}?depth=2`);
            if (resDist.data?.districts) {
              setDistricts(resDist.data.districts);
              
              if (components.district) {
                const foundDist = resDist.data.districts.find((d: Location) => 
                  d.name.includes(components.district) || components.district.includes(d.name)
                );
                if (foundDist) {
                  setSelectedDistrict(foundDist.name);
                }
              }
            }
          }
        }
        
        console.log('📍 Place selected:', res.data.data.formattedAddress);
      }
    } catch (error) {
      console.error('Failed to get place details:', error);
    } finally {
      setIsLoadingMap(false);
    }
  };

  // Update Map when address dropdowns change
  useEffect(() => {
      if (debounceRef.current) {
          clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
          if (selectedProvince) {
              updateMapLocation();
          }
      }, 400); // Reduced from 1000ms for faster response
      
      return () => {
          if (debounceRef.current) {
              clearTimeout(debounceRef.current);
          }
      };
  }, [selectedProvince, selectedDistrict, selectedWard, specificAddress]);

  const updateMapLocation = async () => {
      // Build queries from most specific to least specific
      // Try with specific address first, then fall back to administrative divisions
      
      const queries: string[] = [];
      
      // 1. Try full address first (if specific address is provided)
      if (specificAddress && specificAddress.trim() && selectedDistrict && selectedProvince) {
          queries.push(`${specificAddress}, ${selectedWard || ''}, ${selectedDistrict}, ${selectedProvince}, Vietnam`.replace(/, ,/g, ','));
      }
      
      // 2. Ward + District + Province
      if (selectedWard && selectedDistrict && selectedProvince) {
          queries.push(`${selectedWard}, ${selectedDistrict}, ${selectedProvince}, Vietnam`);
      }
      
      // 3. District + Province
      if (selectedDistrict && selectedProvince) {
          queries.push(`${selectedDistrict}, ${selectedProvince}, Vietnam`);
      }
      
      // 4. Province only
      if (selectedProvince) {
          queries.push(`${selectedProvince}, Vietnam`);
      }

      if (queries.length === 0) return;

      setIsLoadingMap(true);
      
      try {
          for (const query of queries) {
              try {
                const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                    params: {
                        q: query,
                        format: 'json',
                        limit: 1,
                        countrycodes: 'vn', // Restrict to Vietnam
                        addressdetails: 1
                    }
                    // Note: User-Agent removed - browsers don't allow setting it from client-side
                });

                if (res.data && res.data.length > 0) {
                    const { lat, lon, display_name } = res.data[0];
                    const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
                    
                    // Validate result is roughly in Vietnam (lat 8-24, lon 102-110)
                    if (!isNaN(newPos[0]) && 
                        newPos[0] >= 8 && newPos[0] <= 24 && 
                        newPos[1] >= 102 && newPos[1] <= 110) {
                        
                        setMapCenter(newPos);
                        setMarkerPosition(newPos);
                        
                        // Set zoom based on which query succeeded
                        if (query.includes(selectedWard) && selectedWard) {
                            setMapZoom(16); // Ward level
                        } else if (query.includes(selectedDistrict) && selectedDistrict) {
                            setMapZoom(14); // District level
                        } else {
                            setMapZoom(11); // Province level
                        }
                        
                        console.log('Geocoded to:', display_name);
                        break;
                    }
                }
              } catch (innerErr) {
                  console.warn(`Geocoding failed for: ${query}`, innerErr);
              }
          }
      } catch (error) {
           console.error("Map update failed", error);
      } finally {
          setIsLoadingMap(false);
      }
  };

  // Handle Province Change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = e.target.value;
    const provinceName = e.target.options[e.target.selectedIndex].text;
    
    setSelectedProvince(provinceName);
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);
    
    onChange({ province: provinceName, district: '', ward: '', address: '' });

    if (provinceCode) {
       axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`).then(res => {
          if (res.data && res.data.districts) setDistricts(res.data.districts);
       });
    }
  };

  // Handle District Change
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtCode = e.target.value;
    const districtName = e.target.options[e.target.selectedIndex].text;

    setSelectedDistrict(districtName);
    setSelectedWard('');
    setWards([]);

    onChange({ province: selectedProvince, district: districtName, ward: '', address: '' });

    if (districtCode) {
        axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`).then(res => {
            if (res.data && res.data.wards) setWards(res.data.wards);
        });
    }
  };

  // Handle Ward Change
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const wardName = e.target.options[e.target.selectedIndex].text;
      setSelectedWard(wardName);
      onChange({ province: selectedProvince, district: selectedDistrict, ward: wardName, address: '' });
  };

  // Handle manual map pick
  const handleLocationFound = (address: string) => {
      onChange({ 
          province: selectedProvince, 
          district: selectedDistrict, 
          ward: selectedWard, 
          address: address 
      });
  };

  return (
    <div className="space-y-4">
        {/* Google Places Autocomplete Search */}
        <div className="relative">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
            🔍 Tìm kiếm địa chỉ (Google Places)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Nhập địa chỉ để tìm kiếm nhanh..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
            )}
          </div>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={suggestion.placeId || idx}
                  type="button"
                  onClick={() => handleSelectPlace(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 flex items-start gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                >
                  <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {suggestion.mainText || suggestion.description}
                    </p>
                    {suggestion.secondaryText && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {suggestion.secondaryText}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          <span>hoặc chọn thủ công</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Province */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tỉnh/Thành phố *</label>
                <select 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    onChange={handleProvinceChange}
                    value={provinces.find(p => p.name === selectedProvince)?.code || ''}
                    disabled={loadingProv}
                >
                    <option value="">{loadingProv ? 'Đang tải...' : 'Chọn Tỉnh/Thành'}</option>
                    {provinces.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* District */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quận/Huyện *</label>
                <select 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                    onChange={handleDistrictChange}
                    value={districts.find(d => d.name === selectedDistrict)?.code || ''}
                    disabled={!selectedProvince || districts.length === 0}
                >
                    <option value="">Chọn Quận/Huyện</option>
                    {districts.map(d => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                </select>
            </div>

            {/* Ward */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phường/Xã</label>
                <select 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                    onChange={handleWardChange}
                    value={wards.find(w => w.name === selectedWard)?.code || ''}
                    disabled={!selectedDistrict || wards.length === 0}
                >
                    <option value="">Chọn Phường/Xã</option>
                    {wards.map(w => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Map View with Multiple Tile Layer Options */}
        <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-lg relative z-0">
             {isLoadingMap && (
                 <div className="absolute inset-0 z-[1000] bg-white/70 dark:bg-black/70 flex items-center justify-center backdrop-blur-sm">
                     <div className="flex flex-col items-center gap-2">
                         <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                         <span className="text-sm text-gray-600 dark:text-gray-300">Đang tìm vị trí...</span>
                     </div>
                 </div>
             )}
            <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                scrollWheelZoom={true} 
                className="w-full h-full"
            >
                {/* OpenStreetMap France - More detailed for streets */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.fr">OpenStreetMap France</a>'
                    url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
                    maxZoom={20}
                />
                <MapUpdater center={mapCenter} zoom={mapZoom} />
                <LocationMarker 
                    position={markerPosition} 
                    setPosition={setMarkerPosition}
                    onLocationFound={handleLocationFound}
                />
            </MapContainer>
        </div>
        
        {/* Address display */}
        {(selectedProvince || selectedDistrict) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex items-start gap-2">
                <span className="text-lg">📍</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Địa chỉ giao hàng:</strong>
                    <p className="mt-0.5">{[specificAddress, selectedWard, selectedDistrict, selectedProvince].filter(Boolean).join(', ')}</p>
                </div>
            </div>
        )}
        
        <p className="text-xs text-gray-500 italic text-center">
            💡 Click vào bản đồ để chọn vị trí chính xác hơn. Có thể zoom bằng scroll hoặc nút +/-
        </p>
    </div>
  );
}
