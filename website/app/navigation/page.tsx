'use client';

import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MapPin, Search, X, Loader2, Leaf, Footprints, Car, Train, Bus, Bike, CloudFog } from 'lucide-react';

// --- Types & Constants ---
interface Location {
  lat: number;
  lon: number;
  name: string;
}

interface RouteLeg {
  mode: string;
  distance: number;
  duration: number;
  legGeometry: { points: string };
}

interface ParsedRoute {
  title: string;
  durationMins: number;
  modes: string[];
  totalCO2: number;
  co2String: string;
  co2Color: string;
  routeColor: string;
  mainIcon: React.ElementType;
  coordinates: [number, number][];
}

const CO2_FACTORS: Record<string, number> = {
  'WALK': 0,
  'BICYCLE': 0,
  'RAIL': 35,
  'BUS': 82,
  'CAR': 170
};

const OTP_URL = "https://otp-server-879473166500.europe-west2.run.app/otp/routers/default/index/graphql";
const CURRENT_ROUTE_ID = 'route-line';

// --- Utility Functions ---
function decodePolyline(str: string, precision = 5): [number, number][] {
  let index = 0, lat = 0, lng = 0, coordinates: [number, number][] = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change;
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    byte = null; shift = 0; result = 0;
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = result = 0;
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += latitude_change; lng += longitude_change;
    coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}

// --- Main Component ---
export default function NavigationPage() {
  // Map State
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Application State
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  
  // Search State
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromResults, setFromResults] = useState<any[]>([]);
  const [toResults, setToResults] = useState<any[]>([]);
  const fromTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Routing State
  const [routes, setRoutes] = useState<ParsedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number | null>(null);
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- 1. Initialize Map ---
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: [-2.5879, 51.4545], // Bristol
      zoom: 12
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
  }, []);

  // --- 2. Handle Map Markers & Bounds ---
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = new maplibregl.LngLatBounds();

    if (origin) {
      const m = new maplibregl.Marker({ color: "#3b82f6" }).setLngLat([origin.lon, origin.lat]).addTo(map.current);
      markersRef.current.push(m);
      bounds.extend([origin.lon, origin.lat]);
    }
    
    if (destination) {
      const m = new maplibregl.Marker({ color: "#ef4444" }).setLngLat([destination.lon, destination.lat]).addTo(map.current);
      markersRef.current.push(m);
      bounds.extend([destination.lon, destination.lat]);
    }

    if (origin && destination) {
      map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
    } else if (origin || destination) {
      map.current.flyTo({ center: origin ? [origin.lon, origin.lat] : [destination.lon, destination.lat], zoom: 14 });
    }
  }, [origin, destination]);

  // --- 3. Handle Route Drawing ---
  useEffect(() => {
    if (!map.current) return;
    
    // Clean up existing route
    if (map.current.getLayer(CURRENT_ROUTE_ID)) map.current.removeLayer(CURRENT_ROUTE_ID);
    if (map.current.getSource(CURRENT_ROUTE_ID)) map.current.removeSource(CURRENT_ROUTE_ID);

    if (activeRouteIndex !== null && routes[activeRouteIndex]) {
      const route = routes[activeRouteIndex];
      if (!route.coordinates || route.coordinates.length === 0) return;

      map.current.addSource(CURRENT_ROUTE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates
          }
        }
      });

      map.current.addLayer({
        id: CURRENT_ROUTE_ID,
        type: 'line',
        source: CURRENT_ROUTE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': route.routeColor,
          'line-width': 5,
          'line-opacity': 0.8
        }
      });

      // Refit bounds to the drawn route
      const bounds = new maplibregl.LngLatBounds();
      route.coordinates.forEach(coord => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 80, duration: 800 });
    }
  }, [activeRouteIndex, routes]);


  // --- 4. Geocoding Logic ---
  const searchNominatim = async (query: string, setResults: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=-3.5,52,-1.5,50.5&bounded=1`);
      const data = await res.json();
      setResults(data.slice(0, 5));
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFromQuery(val);
    clearTimeout(fromTimeoutRef.current);
    fromTimeoutRef.current = setTimeout(() => searchNominatim(val, setFromResults), 400);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setToQuery(val);
    clearTimeout(toTimeoutRef.current);
    toTimeoutRef.current = setTimeout(() => searchNominatim(val, setToResults), 400);
  };


  // --- 5. OTP Routing Logic ---
  const fetchRoutes = async () => {
    if (!origin || !destination) {
      alert("Please select both a starting point and destination from the dropdown suggestions.");
      return;
    }

    setShowResultsPanel(true);
    setLoading(true);
    setSearchError(null);
    setRoutes([]);
    setActiveRouteIndex(null);

    const query = `
      query {
        plan(
          from: {lat: ${origin.lat}, lon: ${origin.lon}},
          to: {lat: ${destination.lat}, lon: ${destination.lon}},
          numItineraries: 5
        ) {
          itineraries {
            duration
            legs {
              mode
              distance
              duration
              legGeometry { points }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch(OTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const otpData = await response.json();
      
      if (!otpData.data || !otpData.data.plan || !otpData.data.plan.itineraries.length) {
        setSearchError("No routes found between these locations. Are they too far apart for the current map bounds?");
        setLoading(false);
        return;
      }

      const parsedRoutes: ParsedRoute[] = otpData.data.plan.itineraries.map((itinerary: any) => {
        let totalCO2 = 0;
        let allCoordinates: [number, number][] = [];
        let modes: string[] = [];
        let hasTransit = false;

        itinerary.legs.forEach((leg: RouteLeg) => {
          const distKm = leg.distance / 1000;
          const factor = CO2_FACTORS[leg.mode] !== undefined ? CO2_FACTORS[leg.mode] : 100; 
          totalCO2 += distKm * factor;
          
          modes.push(leg.mode);
          if (['BUS', 'RAIL', 'TRAM'].includes(leg.mode)) hasTransit = true;
          
          if (leg.legGeometry?.points) {
            allCoordinates = allCoordinates.concat(decodePolyline(leg.legGeometry.points));
          }
        });

        let mainIcon = Footprints;
        let title = 'Walking Route';
        let routeColor = '#10b981'; 
        
        if (modes.includes('CAR')) {
          mainIcon = Car; title = 'Driving Route'; routeColor = '#ef4444'; 
        } else if (hasTransit) {
          mainIcon = modes.includes('RAIL') ? Train : Bus;
          title = 'Public Transit'; routeColor = '#3b82f6'; 
        } else if (modes.includes('BICYCLE')) {
          mainIcon = Bike; title = 'Cycling Route'; routeColor = '#10b981';
        }

        const durationMins = Math.round(itinerary.duration / 60);

        let co2String = "";
        let co2Color = "";
        if (totalCO2 === 0) {
          co2String = "0g CO₂ (Zero Emission)";
          co2Color = "text-green-600 bg-green-50";
        } else if (totalCO2 < 500) {
          co2String = `${Math.round(totalCO2)}g CO₂ (Low)`;
          co2Color = "text-yellow-600 bg-yellow-50";
        } else {
          co2String = `${Math.round(totalCO2)}g CO₂ (High)`;
          co2Color = "text-red-600 bg-red-50";
        }

        return { title, durationMins, modes, totalCO2, co2String, co2Color, routeColor, mainIcon, coordinates: allCoordinates };
      });

      setRoutes(parsedRoutes);
      if (parsedRoutes.length > 0) setActiveRouteIndex(0); // auto-select first

    } catch (err) {
      console.error("OTP Fetch Error:", err);
      setSearchError("Failed to connect to the routing server. (If this is the first search today, the server might still be waking up - try again in 30 seconds!)");
    } finally {
      setLoading(false);
    }
  };

  const closeResults = () => {
    setShowResultsPanel(false);
    setActiveRouteIndex(null);
  };


  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* MapLibre Stylesheet */}
      <link href="https://unpkg.com/maplibre-gl@3.x/dist/maplibre-gl.css" rel="stylesheet" />

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 z-0 w-full h-full" />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 h-full w-full md:w-96 p-4 z-10 pointer-events-none flex flex-col gap-4">
        
        {/* Search Panel */}
        <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-xl p-5 pointer-events-auto shrink-0 border border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Leaf className="text-green-500 h-6 w-6" /> Eco-Route Planner
          </h1>
          
          <div className="flex flex-col gap-3 relative">
            {/* From Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-blue-500" />
              </div>
              <input 
                type="text" 
                value={fromQuery}
                onChange={handleFromChange}
                placeholder="Starting point (e.g. Bristol Temple Meads)" 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm text-gray-500 bg-white"
              />
              {fromResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60">
                  {fromResults.map((place, i) => (
                    <div 
                      key={i} 
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0 border-gray-100 truncate"
                      onClick={() => {
                        const name = place.display_name.split(',').slice(0,3).join(',');
                        setFromQuery(name);
                        setOrigin({ lat: parseFloat(place.lat), lon: parseFloat(place.lon), name });
                        setFromResults([]);
                      }}
                    >
                      {place.display_name.split(',').slice(0,3).join(',')}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* To Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-red-500" />
              </div>
              <input 
                type="text" 
                value={toQuery}
                onChange={handleToChange}
                placeholder="Destination (e.g. Clifton Suspension Bridge)" 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm text-gray-500 bg-white"
              />
              {toResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60">
                  {toResults.map((place, i) => (
                    <div 
                      key={i} 
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0 border-gray-100 truncate"
                      onClick={() => {
                        const name = place.display_name.split(',').slice(0,3).join(',');
                        setToQuery(name);
                        setDestination({ lat: parseFloat(place.lat), lon: parseFloat(place.lon), name });
                        setToResults([]);
                      }}
                    >
                      {place.display_name.split(',').slice(0,3).join(',')}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={fetchRoutes}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm mt-1"
            >
              <Search className="h-4 w-4" /> Find Routes
            </button>
          </div>
        </div>

        {/* Results Panel */}
        {showResultsPanel && (
          <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-xl pointer-events-auto flex flex-col overflow-hidden border border-gray-200 h-full max-h-[calc(100vh-16rem)]">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-gray-800">Available Routes</h2>
              <button onClick={closeResults} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Loading State */}
            {loading && (
              <div className="p-8 flex flex-col items-center justify-center text-gray-500 h-full">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-green-500" />
                <p className="text-sm font-medium">Calculating optimal routes...</p>
                <p className="text-xs mt-1 text-center">Querying OpenTripPlanner & checking emissions</p>
              </div>
            )}

            {/* Error State */}
            {!loading && searchError && (
              <div className="p-6 text-center text-red-500 text-sm">
                {searchError}
              </div>
            )}

            {/* Route List */}
            {!loading && !searchError && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {routes.map((route, idx) => {
                  const Icon = route.mainIcon;
                  const isActive = activeRouteIndex === idx;
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => setActiveRouteIndex(idx)}
                      className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                        isActive ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                          <Icon className="h-5 w-5" style={{ color: route.routeColor }} />
                          {route.title}
                        </div>
                        <div className="font-bold text-gray-700">{route.durationMins} min</div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3 items-center">
                        {route.modes.map((mode, mIdx) => (
                          <React.Fragment key={mIdx}>
                            <span className="text-[11px] font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                              {mode}
                            </span>
                            {mIdx < route.modes.length - 1 && <span className="text-xs text-gray-400">→</span>}
                          </React.Fragment>
                        ))}
                      </div>

                      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md ${route.co2Color}`}>
                        <CloudFog className="h-3.5 w-3.5" /> {route.co2String}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Scrollbar styles inject */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}