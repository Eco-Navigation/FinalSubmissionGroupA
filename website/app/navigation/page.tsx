'use client';
import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MapPin, Search, X, Loader2, Leaf, Footprints, Car, Train, Bus, Bike, CloudFog, Route, Calendar, Clock } from 'lucide-react';

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
  startTime: number;
  endTime: number;
  from: { name: string };
  to: { name: string };
  route?: { shortName?: string };
  legGeometry: { points: string };
}

interface RouteLegData {
  mode: string;
  color: string;
  coordinates: [number, number][];
}

interface DetailedLeg {
  mode: string;
  icon: React.ElementType;
  color: string;
  durationMins: number;
  distanceKm: string;
  fromName: string;
  toName: string;
  routeName: string;
  startTimeStr: string;
  endTimeStr: string;
}

interface ParsedRoute {
  title: string;
  durationMins: number;
  modes: string[];
  totalDistKm: number;
  distString: string;
  totalCO2g: number;
  co2String: string;
  co2Color: string;
  routeColor: string;
  mainIcon: React.ElementType;
  legsData: RouteLegData[];
  detailedLegs: DetailedLeg[];
}

const CO2_FACTORS: Record<string, number> = {
  'WALK': 0,
  'BICYCLE': 0,
  'RAIL': 35,
  'BUS': 82,
  'CAR': 170
};

// Colors for the map lines based on the travel mode
const MODE_COLORS: Record<string, string> = {
  'WALK': '#42db06',
  'BICYCLE': '#07e29d',
  'CAR': '#d74545',
  'BUS': '#d8db06',
  'RAIL': '#0c73da',
  'TRAM': '#06cdd4'
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

  // Routing Options State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [arriveBy, setArriveBy] = useState(false);
  const [selectedModes, setSelectedModes] = useState<string[]>(['WALK', 'TRANSIT']);

  // Routing State
  const [routes, setRoutes] = useState<ParsedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number | null>(null);
  const [expandedRouteIndex, setExpandedRouteIndex] = useState<number | null>(null);
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

    const mapPadding = { top: 80, bottom: 80, left: 450, right: 80 };

    if (origin && destination) {
      map.current.fitBounds(bounds, { padding: mapPadding, duration: 1000 });
    } else if (origin) {
      map.current.flyTo({ center: [origin.lon, origin.lat], zoom: 14, padding: mapPadding });
    } else if (destination) {
      map.current.flyTo({ center: [destination.lon, destination.lat], zoom: 14, padding: mapPadding });
    }
  }, [origin, destination]);

  // --- 3. Handle Route Drawing ---
  useEffect(() => {
    if (!map.current) return;
    
    // Clean up existing route and outline
    if (map.current.getLayer(CURRENT_ROUTE_ID)) map.current.removeLayer(CURRENT_ROUTE_ID);
    if (map.current.getLayer(`${CURRENT_ROUTE_ID}-outline`)) map.current.removeLayer(`${CURRENT_ROUTE_ID}-outline`);
    if (map.current.getSource(CURRENT_ROUTE_ID)) map.current.removeSource(CURRENT_ROUTE_ID);

    if (activeRouteIndex !== null && routes[activeRouteIndex]) {
      const route = routes[activeRouteIndex];
      if (!route.legsData || route.legsData.length === 0) return;

      // Construct a FeatureCollection to hold separate LineStrings for each leg
      const features = route.legsData.map(leg => ({
        type: 'Feature' as const,
        properties: { color: leg.color },
        geometry: {
          type: 'LineString' as const,
          coordinates: leg.coordinates
        }
      }));

      map.current.addSource(CURRENT_ROUTE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      // 1. Add Outline Layer First (Rendered underneath)
      map.current.addLayer({
        id: `${CURRENT_ROUTE_ID}-outline`,
        type: 'line',
        source: CURRENT_ROUTE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#1f2937', // Dark gray / almost black outline
          'line-width': 8,         // Wider than the inner line
          'line-opacity': 0.7
        }
      });

      // 2. Add Main Color Layer on top
      map.current.addLayer({
        id: CURRENT_ROUTE_ID,
        type: 'line',
        source: CURRENT_ROUTE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          // Use data-driven styling to grab the color from the feature properties
          'line-color': ['get', 'color'],
          'line-width': 4,
          'line-opacity': 1 // Fully opaque so outline doesn't bleed through
        }
      });

      // Refit bounds to cover all drawn route segments
      const bounds = new maplibregl.LngLatBounds();
      route.legsData.forEach(leg => {
        leg.coordinates.forEach(coord => bounds.extend(coord as [number, number]));
      });
      
      // Use an object to apply specific padding to the left side (accounting for the ~384px wide UI panel)
      map.current.fitBounds(bounds, { 
        padding: { top: 80, bottom: 80, left: 420, right: 80 }, 
        duration: 800 
      });
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

  const handleModeToggle = (mode: string) => {
    setSelectedModes(prev => {
      if (prev.includes(mode)) {
        if (prev.length === 1) return prev; // Prevent deselecting all modes
        return prev.filter(m => m !== mode);
      }
      return [...prev, mode];
    });
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
    setExpandedRouteIndex(null);

    // 1. Define a GraphQL Fragment so we don't have to repeat the requested fields
    const fragment = `
      fragment itineraryFields on Plan {
        itineraries {
          duration
          legs {
            mode
            distance
            duration
            startTime
            endTime
            from { name }
            to { name }
            route { shortName }
            legGeometry { points }
          }
        }
      }
    `;

    // 2. Build the base arguments shared across all queries
    const baseArgs = `from: {lat: ${origin.lat}, lon: ${origin.lon}}, to: {lat: ${destination.lat}, lon: ${destination.lon}}, date: "${date}", time: "${time}", arriveBy: ${arriveBy}, numItineraries: 5`;
    
    // 3. Dynamically construct aliased queries based on selected modes
    let queryAliases = [];

    if (selectedModes.includes('WALK')) {
      queryAliases.push(`walk: plan(${baseArgs}, transportModes: [{mode: WALK}]) { ...itineraryFields }`);
    }
    if (selectedModes.includes('BICYCLE')) {
      queryAliases.push(`bike: plan(${baseArgs}, transportModes: [{mode: BICYCLE}]) { ...itineraryFields }`);
    }
    if (selectedModes.includes('CAR')) {
      queryAliases.push(`car: plan(${baseArgs}, transportModes: [{mode: CAR}]) { ...itineraryFields }`);
    }
    if (selectedModes.includes('TRANSIT')) {
      // Standard transit (allows walking to the station)
      queryAliases.push(`transit: plan(${baseArgs}, transportModes: [{mode: TRANSIT}, {mode: WALK}]) { ...itineraryFields }`);
      
      // If both Bike AND Transit are selected, explicitly ask for a multimodal "Bike to Station" route
      if (selectedModes.includes('BICYCLE')) {
        // Added {mode: WALK} here as well so the user can walk through the station
        queryAliases.push(`bikeTransit: plan(${baseArgs}, transportModes: [{mode: TRANSIT}, {mode: BICYCLE}, {mode: WALK}]) { ...itineraryFields }`);
      }
      
      // If both Car AND Transit are selected, explicitly ask for a multimodal "Park & Ride" route
      if (selectedModes.includes('CAR')) {
        // Using qualifier: PARK explicitly tells OTP2 to route the car to an official Park & Ride facility
        queryAliases.push(`parkAndRide: plan(${baseArgs}, transportModes: [{mode: TRANSIT}, {mode: WALK}, {mode: CAR, qualifier: PARK}]) { ...itineraryFields }`);
      }
    }

    if (queryAliases.length === 0) {
      setSearchError("Please select at least one transport mode.");
      setLoading(false);
      return;
    }

    // Combine them all into one massive batch query
    const query = `
      ${fragment}
      query {
        ${queryAliases.join('\n        ')}
      }
    `;

    try {
      const response = await fetch(OTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const otpData = await response.json();
      
      // Safely log any internal GraphQL errors to the console to help with future debugging
      if (otpData.errors) {
        console.error("OTP GraphQL Errors:", otpData.errors);
      }
      
      // 4. Extract itineraries from all the separate aliases into one flat array
      let allItineraries: any[] = [];
      if (otpData?.data) {
        Object.values(otpData.data).forEach((plan: any) => {
          if (plan && plan.itineraries) {
            allItineraries.push(...plan.itineraries);
          }
        });
      }
      
      if (allItineraries.length === 0) {
        setSearchError("No routes found between these locations. Are they too far apart for the current map bounds?");
        setLoading(false);
        return;
      }

      // 5. Deduplicate routes (sometimes the 'bike' query and 'bikeTransit' query return the exact same route)
      const uniqueItineraries: any[] = [];
      const seen = new Set();
      allItineraries.forEach(itin => {
        // Create a unique signature based on duration and mode sequence
        const sig = Math.round(itin.duration) + "_" + itin.legs.map((l: any) => l.mode).join('-');
        if (!seen.has(sig)) {
          seen.add(sig);
          uniqueItineraries.push(itin);
        }
      });

      const parsedRoutes: ParsedRoute[] = uniqueItineraries.map((itinerary: any) => {
        let totalCO2g = 0;
        let totalDistKm = 0;
        let legsData: RouteLegData[] = [];
        let detailedLegs: DetailedLeg[] = [];
        let modes: string[] = [];
        
        let hasCar = false;
        let hasTransit = false;

        itinerary.legs.forEach((leg: RouteLeg) => {
          const distKm = leg.distance / 1000;
          totalDistKm += distKm;
          const factor = CO2_FACTORS[leg.mode] !== undefined ? CO2_FACTORS[leg.mode] : 100; 
          totalCO2g += distKm * factor;
          
          modes.push(leg.mode);
          if (['BUS', 'RAIL', 'TRAM'].includes(leg.mode)) hasTransit = true;
          // Catch any variation of the car mode returned by the server
          if (leg.mode === 'CAR' || leg.mode === 'CAR_PARK' || leg.mode === 'CAR_TO_PARK') hasCar = true;
          
          const legColor = MODE_COLORS[leg.mode] || '#6b7280'; // fallback to dark gray
          
          if (leg.legGeometry?.points) {
            const coords = decodePolyline(leg.legGeometry.points);
            legsData.push({
              mode: leg.mode,
              color: legColor,
              coordinates: coords
            });
          }

          // Build Detailed Leg Data for the step-by-step UI
          const startTimeStr = new Date(leg.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endTimeStr = new Date(leg.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const routeName = leg.route?.shortName || '';
          const fromName = leg.from?.name || 'Origin';
          const toName = leg.to?.name || 'Destination';
          const durationMins = Math.round(leg.duration / 60);

          let legIcon = Footprints;
          if (leg.mode.includes('CAR')) legIcon = Car;
          else if (['BUS', 'TRAM'].includes(leg.mode)) legIcon = Bus;
          else if (leg.mode === 'RAIL') legIcon = Train;
          else if (leg.mode === 'BICYCLE') legIcon = Bike;

          detailedLegs.push({
            mode: leg.mode,
            icon: legIcon,
            color: legColor,
            durationMins,
            distanceKm: distKm.toFixed(1),
            fromName,
            toName,
            routeName,
            startTimeStr,
            endTimeStr
          });
        });

        // Determine title, icon, and main route color based on the modes present
        let mainIcon = Footprints;
        let title = 'Walking Route';
        let routeColor = '#10b981'; 
        
        if (hasCar && hasTransit) {
          mainIcon = Car; 
          title = 'Park & Ride'; 
          routeColor = '#f59e0b'; // Amber to distinguish from standard transit/driving
        } else if (hasCar) {
          mainIcon = Car; 
          title = 'Driving Route'; 
          routeColor = '#ef4444'; 
        } else if (hasTransit) {
          mainIcon = modes.includes('RAIL') ? Train : Bus;
          title = 'Public Transit'; 
          routeColor = '#3b82f6'; 
        } else if (modes.includes('BICYCLE')) {
          mainIcon = Bike; 
          title = 'Cycling Route'; 
          routeColor = '#10b981';
        }

        const durationMins = Math.round(itinerary.duration / 60);

        const perKmCO2 = totalDistKm > 0 ? totalCO2g / totalDistKm : 0;
        let distString = `${totalDistKm.toFixed(1)} km`;
        let co2String = "";
        let co2Color = "";
        if (perKmCO2 < 20) {
          co2String = `${Math.round(totalCO2g)}g CO₂ (Very Low)`;
          co2Color = "text-green-600 bg-green-50";
        } else if (perKmCO2 < 80) {
          co2String = `${Math.round(totalCO2g)}g CO₂ (Low)`;
          co2Color = "text-yellow-600 bg-yellow-50";
        } else {
          co2String = `${Math.round(totalCO2g)}g CO₂ (High)`;
          co2Color = "text-red-600 bg-red-50";
        }

        return { title, durationMins, modes, totalDistKm, distString, totalCO2g, co2String, co2Color, routeColor, mainIcon, legsData, detailedLegs };
      });

      // Sort the final results by duration so the fastest route appears at the top
      parsedRoutes.sort((a, b) => a.durationMins - b.durationMins);

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
                <div className="absolute z-50 w-full mt-1 text-gray-500 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60">
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
                <div className="absolute z-50 w-full mt-1 text-gray-500 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60">
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
            
            {/* Routing Options (Time, Date, Modes) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <div className="flex gap-2">
                <select 
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm flex-1 bg-white focus:ring-2 focus:ring-green-500 outline-none text-gray-700"
                  value={arriveBy ? 'arrive' : 'depart'}
                  onChange={(e) => setArriveBy(e.target.value === 'arrive')}
                >
                  <option value="depart">Depart at</option>
                  <option value="arrive">Arrive by</option>
                </select>
                <input 
                  type="time" 
                  value={time} 
                  onChange={e => setTime(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm flex-1 bg-white focus:ring-2 focus:ring-green-500 outline-none text-gray-700"
                />
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm flex-1 bg-white focus:ring-2 focus:ring-green-500 outline-none text-gray-700"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'WALK', label: 'Walk', icon: Footprints },
                  { id: 'TRANSIT', label: 'Transit', icon: Bus },
                  { id: 'BICYCLE', label: 'Cycle', icon: Bike },
                  { id: 'CAR', label: 'Drive', icon: Car },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleModeToggle(m.id)}
                    className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border text-xs gap-1 transition-colors ${
                      selectedModes.includes(m.id)
                        ? 'bg-green-50 border-green-500 text-green-700 font-medium' 
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <m.icon className="h-4 w-4" />
                    {m.label}
                  </button>
                ))}
              </div>
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
          <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-xl pointer-events-auto flex flex-col overflow-hidden border border-gray-200 h-full max-h-[calc(100vh-26rem)]">
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
                  const isExpanded = expandedRouteIndex === idx;
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        if (activeRouteIndex !== idx) {
                          setActiveRouteIndex(idx);
                          setExpandedRouteIndex(null); // Reset details panel when switching routes
                        }
                      }}
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
                            <span 
                              className="text-[11px] font-medium px-2 py-1 text-white rounded-md"
                              style={{ backgroundColor: MODE_COLORS[mode] || '#6b7280' }}
                            >
                              {mode}
                            </span>
                            {mIdx < route.modes.length - 1 && <span className="text-xs text-gray-700">→</span>}
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md ${route.co2Color}`}>
                          <CloudFog className="h-3.5 w-3.5" /> {route.co2String}
                        </div>
                        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md ${route.co2Color}`}>
                          <Route className="h-3.5 w-3.5" /> {route.distString}
                        </div>
                      </div>

                      {/* --- Expandable Details Panel --- */}
                      {isActive && (
                        <div className="mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRouteIndex(isExpanded ? null : idx);
                            }}
                            className="w-full py-1.5 text-xs font-bold text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors border border-green-200"
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-0 cursor-default" onClick={e => e.stopPropagation()}>
                              {route.detailedLegs.map((leg, lIdx) => (
                                <div key={lIdx} className="flex gap-3 text-sm min-h-[60px]">
                                  {/* Timeline left column */}
                                  <div className="flex flex-col items-center">
                                    <div className="font-bold text-gray-700 text-[10px] w-12 text-right">{leg.startTimeStr}</div>
                                    <div className="w-1 flex-1 my-1 rounded-full" style={{ backgroundColor: leg.color }}></div>
                                  </div>
                                  
                                  {/* Info right column */}
                                  <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-1.5 font-semibold text-gray-800 mb-0.5">
                                      <leg.icon className="h-3.5 w-3.5" style={{ color: leg.color }} />
                                      <span>
                                        {leg.mode === 'WALK' ? 'Walk' : 
                                         leg.mode === 'BICYCLE' ? 'Cycle' : 
                                         leg.mode.includes('CAR') ? 'Drive' : 
                                         `${leg.mode === 'RAIL' ? 'Train' : 'Bus'} ${leg.routeName ? leg.routeName : ''}`}
                                      </span>
                                      <span className="text-gray-400 text-xs font-normal ml-1">({leg.durationMins} min)</span>
                                    </div>
                                    <div className="text-gray-500 text-xs leading-relaxed pr-2">
                                      <div className="truncate"><span className="font-medium text-gray-600">From:</span> {leg.fromName}</div>
                                      <div className="truncate"><span className="font-medium text-gray-600">To:</span> {leg.toName}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Final Destination Dot */}
                              <div className="flex gap-3 text-sm">
                                <div className="flex flex-col items-center">
                                  <div className="font-bold text-gray-700 text-[10px] w-12 text-right">
                                    {route.detailedLegs[route.detailedLegs.length - 1]?.endTimeStr}
                                  </div>
                                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1 ml-1 mr-1"></div>
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-800 text-xs mt-0.5">Arrive at Destination</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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