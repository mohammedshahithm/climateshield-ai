"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Search, ShieldAlert, Droplets, ThermometerSun, 
  Wind, ActivitySquare, Users, Home, MapPin, Loader2, AlertCircle,
  Ambulance, Users2
} from "lucide-react";
import { useLocation } from "@/providers/LocationContext";
import { fetchWeather, fetchLocationName, geocodeAddress } from "@/lib/weather";
import { useResourceShelters, Shelter, Resource } from "@/lib/ResourceShelterContext";
import { fetchAirQuality } from "@/lib/airQuality";
import { fetchFloodRisk } from "@/lib/floodRisk";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

// The MapComponent must be dynamically imported because Leaflet requires window
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 animate-pulse flex flex-col items-center justify-center text-gray-400 border border-gray-100 min-h-[500px]">
      <MapPin className="h-10 w-10 mb-3 text-gray-300 animate-bounce" />
      <span className="font-medium">Initializing Map Engine...</span>
    </div>
  )
});

import type { RiskMarkerData, MapActiveLayers } from "@/components/maps/MapComponent";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Predefined worldwide cities to show on the map for climate intelligence
const PRESET_CITIES = [
  { id: "chennai", name: "Chennai, India", lat: 13.0827, lng: 80.2707, shelter: "Chennai Central Shelter", shelterLat: 13.0815, shelterLng: 80.2720 },
  { id: "newyork", name: "New York, USA", lat: 40.7128, lng: -74.0060, shelter: "Manhattan Relief Hub", shelterLat: 40.7140, shelterLng: -74.0045 },
  { id: "london", name: "London, UK", lat: 51.5074, lng: -0.1278, shelter: "Westminster Safe Zone", shelterLat: 51.5085, shelterLng: -0.1260 },
  { id: "tokyo", name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, shelter: "Shinjuku Shelter Station", shelterLat: 35.6780, shelterLng: 139.6480 },
  { id: "sydney", name: "Sydney, Australia", lat: -33.8688, lng: 151.2093, shelter: "Sydney Town Hall Hub", shelterLat: -33.8700, shelterLng: 151.2080 },
];

// Helper to fetch weather, AQI, and flood risk data in parallel for a given location
async function fetchMarkerData(
  id: string,
  name: string,
  lat: number,
  lng: number,
  shelter?: string,
  shelterLat?: number,
  shelterLng?: number
): Promise<RiskMarkerData> {
  const [weather, aqi, flood] = await Promise.all([
    fetchWeather(lat, lng),
    fetchAirQuality(lat, lng),
    fetchFloodRisk(lat, lng),
  ]);

  // Determine sub-risk levels
  let floodLevel = 0;
  if (flood.score > 75) floodLevel = 3;
  else if (flood.score > 50) floodLevel = 2;
  else if (flood.score > 25) floodLevel = 1;

  let aqiLevel = 0;
  if (aqi.usAqi > 150) aqiLevel = 3;
  else if (aqi.usAqi > 100) aqiLevel = 2;
  else if (aqi.usAqi > 50) aqiLevel = 1;

  let heatLevel = 0;
  if (weather.temperature > 100) heatLevel = 3;
  else if (weather.temperature > 90) heatLevel = 2;
  else if (weather.temperature > 80) heatLevel = 1;

  const maxLevel = Math.max(floodLevel, aqiLevel, heatLevel);
  const overallRisk: "Low" | "Moderate" | "High" | "Critical" =
    maxLevel === 3 ? "Critical" :
    maxLevel === 2 ? "High" :
    maxLevel === 1 ? "Moderate" : "Low";

  let action = "Maintain baseline preparedness. No immediate threat.";
  if (overallRisk === "Critical") {
    action = "Severe warning active. Evacuation planning recommended.";
  } else if (overallRisk === "High") {
    action = "High vulnerability detected. Limit exposure & secure assets.";
  } else if (overallRisk === "Moderate") {
    action = "Moderate risk. Monitor updates and clear storm drains.";
  }

  // Composite risk score: max of flood score and AQI-normalized score
  const score = Math.max(flood.score, Math.round((aqi.usAqi / 300) * 100));

  return {
    id,
    name,
    lat,
    lng,
    overallRisk,
    score,
    temperature: weather.temperature,
    humidity: weather.humidity,
    aqi: aqi.usAqi,
    aqiStatus: aqi.status,
    floodRisk: flood.score,
    floodRiskStatus: flood.status,
    action,
    shelter,
    shelterLat,
    shelterLng,
  };
}

export default function RiskMapsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { city: contextCity, latitude, longitude, setLocation } = useLocation();
  const { shelters, resources, loading: resourceShelterLoading } = useResourceShelters();
  const [center, setCenter] = useState<[number, number]>([latitude, longitude]);
  const [highlightedMarker, setHighlightedMarker] = useState<string | null>(null);
  const [markers, setMarkers] = useState<RiskMarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nearestShelter = useMemo(() => {
    if (!shelters || shelters.length === 0) return null;
    let nearest: Shelter | null = null;
    let minDistance = Infinity;
    for (const s of shelters) {
      const dist = calculateDistance(latitude, longitude, s.latitude, s.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = s;
      }
    }
    return nearest ? { shelter: nearest as Shelter, distance: minDistance } : null;
  }, [shelters, latitude, longitude]);

  const nearestAmbulance = useMemo(() => {
    const ambulances = resources.filter(r => r.type === "Ambulance");
    if (ambulances.length === 0) return null;
    let nearest: Resource | null = null;
    let minDistance = Infinity;
    for (const a of ambulances) {
      const dist = calculateDistance(latitude, longitude, a.latitude, a.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = a;
      }
    }
    return nearest ? { ambulance: nearest as Resource, distance: minDistance } : null;
  }, [resources, latitude, longitude]);

  const nearestRescueTeam = useMemo(() => {
    const rescueTeams = resources.filter(r => r.type === "Rescue Team");
    if (rescueTeams.length === 0) return null;
    let nearest: Resource | null = null;
    let minDistance = Infinity;
    for (const rt of rescueTeams) {
      const dist = calculateDistance(latitude, longitude, rt.latitude, rt.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = rt;
      }
    }
    return nearest ? { rescueTeam: nearest as Resource, distance: minDistance } : null;
  }, [resources, latitude, longitude]);
  
  const [activeLayers, setActiveLayers] = useState<MapActiveLayers>({
    weather: true,
    airQuality: true,
    flood: true,
    incidents: true,
  });

  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    async function loadIncidents() {
      try {
        const { data, error } = await supabase.from("incidents").select("*");
        if (error) {
          console.error("Error loading incidents:", error);
        } else if (data) {
          setIncidents(data);
        }
      } catch (err) {
        console.error("Failed to load incidents on map:", err);
      }
    }
    loadIncidents();
  }, []);

  // Re-sync center when global context location changes
  useEffect(() => {
    setCenter([latitude, longitude]);
  }, [latitude, longitude]);

  // Load weather, AQI, and flood risk data for all markers on coordinates change
  useEffect(() => {
    let active = true;

    async function loadAllData() {
      setLoading(true);
      setError(null);
      try {
        const currentSelected = {
          id: "selected",
          name: contextCity ? `${contextCity} (Selected Location)` : "Selected Location",
          lat: latitude,
          lng: longitude,
          shelter: "Local Safe Zone Hub",
          shelterLat: latitude + 0.003,
          shelterLng: longitude + 0.003,
        };

        // Filter presets to avoid duplication if user selected one of them
        const otherPresets = PRESET_CITIES.filter(
          preset => Math.abs(preset.lat - latitude) > 0.05 || Math.abs(preset.lng - longitude) > 0.05
        );

        const targets = [currentSelected, ...otherPresets];

        const results = await Promise.all(
          targets.map(async (t) => {
            try {
              return await fetchMarkerData(
                t.id,
                t.name,
                t.lat,
                t.lng,
                t.shelter,
                t.shelterLat,
                t.shelterLng
              );
            } catch (e) {
              console.error(`Failed to fetch live data for ${t.name}:`, e);
              // Safe fallback marker
              return {
                id: t.id,
                name: t.name,
                lat: t.lat,
                lng: t.lng,
                overallRisk: "Low" as const,
                score: 10,
                temperature: 72,
                humidity: 60,
                aqi: 25,
                aqiStatus: "Good",
                floodRisk: 5,
                floodRiskStatus: "Low Risk",
                action: "Live data retrieval failed; displaying baseline parameters.",
                shelter: t.shelter,
                shelterLat: t.shelterLat,
                shelterLng: t.shelterLng,
              };
            }
          })
        );

        if (active) {
          setMarkers(results);
        }
      } catch (err) {
        console.error("Failed to load map climate data:", err);
        if (active) {
          setError("Unable to retrieve climate metrics. Please check network.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAllData();
    return () => {
      active = false;
    };
  }, [latitude, longitude, contextCity]);

  // Handle global search form submit
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      toast.error("Please enter a location to search.");
      return;
    }

    setSearchLoading(true);
    try {
      const geocoded = await geocodeAddress(query);
      if (!geocoded) {
        toast.error("Location not found. Please try another search.");
        return;
      }
      
      // Update global context location, triggers coordinates effect
      setLocation(
        geocoded.name,
        geocoded.latitude,
        geocoded.longitude,
        geocoded.region,
        geocoded.country
      );
      
      setCenter([geocoded.latitude, geocoded.longitude]);
      setHighlightedMarker("selected");
      setSearchQuery("");
      toast.success(`Located: ${geocoded.name}`);
    } catch (err: any) {
      console.error("Geocoding failed:", err);
      
      let errorMessage = "An error occurred while searching. Please try again.";
      if (err instanceof Error) {
        if (err.name === "TimeoutError" || err.message.includes("timeout") || err.message.includes("aborted")) {
          errorMessage = "Search timed out. Please check your network connection and try again.";
        } else if (err.message.includes("Failed to fetch") || err.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (err.message.includes("Geocoding server responded")) {
          errorMessage = "Search service is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = err.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle click on map to select/fetch new location
  const handleMapClick = async (lat: number, lng: number) => {
    setSearchLoading(true);
    try {
      const reverseName = await fetchLocationName(lat, lng);
      
      // Extract a short city name
      const cityPart = reverseName.split(",")[0] || "Custom Point";
      
      // Update global location context
      setLocation(cityPart, lat, lng);
      
      setCenter([lat, lng]);
      setHighlightedMarker("selected");
      toast.success(`Selected: ${cityPart}`);
    } catch (err) {
      console.error("Map click reverse geocoding failed:", err);
      toast.error("Failed to fetch location name.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Fly to target station from list click
  const selectStation = (marker: RiskMarkerData) => {
    setCenter([marker.lat, marker.lng]);
    setHighlightedMarker(marker.id);
  };

  // Live stats calculated from active markers
  const stats = useMemo(() => {
    const total = markers.length;
    if (total === 0) return { highRisk: 0, moderate: 0, stations: 0, critical: 0 };
    return {
      highRisk: markers.filter(m => m.overallRisk === "High").length,
      critical: markers.filter(m => m.overallRisk === "Critical").length,
      moderate: markers.filter(m => m.overallRisk === "Moderate").length,
      stations: total,
    };
  }, [markers]);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 pb-4">
      {/* Header & Stats */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive Risk Maps</h1>
          <p className="text-sm text-gray-500">Real-time geospatial climate vulnerability intelligence.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><ShieldAlert className="h-5 w-5 animate-pulse" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Critical</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{stats.critical} Zones</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><AlertCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">High Risk</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{stats.highRisk} Zones</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><ActivitySquare className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Moderate</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{stats.moderate} Zones</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Home className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Stations</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{stats.stations} Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        
        {/* Controls Sidebar */}
        <div className="w-full md:w-72 flex flex-col gap-4 shrink-0 overflow-y-auto">
          {/* Search Box */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Global Search</h3>
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search city, region, or country..."
                disabled={searchLoading}
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:bg-gray-50"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
              {searchLoading && (
                <Loader2 className="h-4 w-4 text-primary-500 animate-spin absolute right-3 top-2.5" />
              )}
            </form>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Or click anywhere on the map to query climate details.</p>
          </div>

          {/* Layer Toggles */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Climate Layers</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ThermometerSun className="h-4 w-4 text-orange-500" />
                  Weather Layer
                </div>
                <input 
                  type="checkbox" 
                  checked={activeLayers.weather} 
                  onChange={(e) => setActiveLayers({...activeLayers, weather: e.target.checked})} 
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" 
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Wind className="h-4 w-4 text-teal-500" />
                  AQI Layer
                </div>
                <input 
                  type="checkbox" 
                  checked={activeLayers.airQuality} 
                  onChange={(e) => setActiveLayers({...activeLayers, airQuality: e.target.checked})} 
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" 
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Flood Risk Layer
                </div>
                <input 
                  type="checkbox" 
                  checked={activeLayers.flood} 
                  onChange={(e) => setActiveLayers({...activeLayers, flood: e.target.checked})} 
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" 
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Citizen Incidents
                </div>
                <input 
                  type="checkbox" 
                  checked={activeLayers.incidents || false} 
                  onChange={(e) => setActiveLayers({...activeLayers, incidents: e.target.checked})} 
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" 
                />
              </label>
            </div>
          </div>

          {/* Tracked Stations List */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-[220px]">
            <h3 className="font-bold text-gray-900 mb-3 text-sm shrink-0 flex items-center justify-between">
              <span>Climate Stations</span>
              {loading && <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />}
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {markers.map((marker) => (
                <button
                  key={marker.id}
                  onClick={() => selectStation(marker)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                    highlightedMarker === marker.id
                      ? "border-primary-500 bg-primary-50/50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/80"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-900 truncate max-w-[130px]">{marker.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      marker.overallRisk === "Low" ? "bg-green-100 text-green-700" :
                      marker.overallRisk === "Moderate" ? "bg-yellow-100 text-yellow-700" :
                      marker.overallRisk === "High" ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>{marker.overallRisk}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 mt-1">
                    <span>Temp: {marker.temperature}°F</span>
                    <span>AQI: {marker.aqi}</span>
                    <span>Flood: {marker.floodRisk}%</span>
                  </div>
                </button>
              ))}
              
              {!loading && markers.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-8">
                  <MapPin className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-xs">No active climate stations loaded.</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100 shrink-0">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legend</h4>
              <div className="grid grid-cols-2 gap-y-1.5 text-[10px] font-semibold text-gray-600">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Low Risk</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Moderate</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> High Risk</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical</div>
              </div>
            </div>
          </div>

          {/* Nearest Emergency Services Panel */}
          {!resourceShelterLoading && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm border-b pb-2 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-primary-500" />
                Nearest Emergency Services
              </h3>
              <div className="space-y-3 text-xs">
                {/* Nearest Shelter */}
                {nearestShelter ? (
                  <div className="space-y-1">
                    <p className="font-bold text-gray-500 uppercase text-[9px] tracking-wider">Nearest Shelter</p>
                    <p className="font-bold text-gray-800 truncate">{nearestShelter.shelter.name}</p>
                    <div className="flex justify-between text-gray-500 text-[10px]">
                      <span>{nearestShelter.distance.toFixed(1)} km away</span>
                      <span className={nearestShelter.shelter.status === "Active" ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                        {nearestShelter.shelter.capacity - nearestShelter.shelter.occupied} spaces left
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No shelters available</p>
                )}

                {/* Nearest Ambulance */}
                {nearestAmbulance ? (
                  <div className="space-y-1 border-t pt-2 border-gray-100">
                    <p className="font-bold text-gray-500 uppercase text-[9px] tracking-wider">Nearest Ambulance</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">{nearestAmbulance.distance.toFixed(1)} km away</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                        nearestAmbulance.ambulance.status === "Available" ? "bg-green-50 text-green-700 border-green-200" :
                        nearestAmbulance.ambulance.status === "Deployed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-orange-50 text-orange-700 border-orange-200"
                      }`}>{nearestAmbulance.ambulance.status}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 border-t pt-2 border-gray-100">No ambulances nearby</p>
                )}

                {/* Nearest Rescue Team */}
                {nearestRescueTeam ? (
                  <div className="space-y-1 border-t pt-2 border-gray-100">
                    <p className="font-bold text-gray-500 uppercase text-[9px] tracking-wider">Nearest Rescue Team</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">{nearestRescueTeam.distance.toFixed(1)} km away</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                        nearestRescueTeam.rescueTeam.status === "Available" ? "bg-green-50 text-green-700 border-green-200" :
                        nearestRescueTeam.rescueTeam.status === "Deployed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-orange-50 text-orange-700 border-orange-200"
                      }`}>{nearestRescueTeam.rescueTeam.status}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 border-t pt-2 border-gray-100">No rescue teams nearby</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map Container Area */}
        <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative min-h-[400px] z-0">
          {error && (
            <div className="absolute inset-x-4 top-4 z-[1000] bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs font-semibold flex items-center gap-2 shadow-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <MapComponent 
            center={center} 
            markers={markers} 
            incidents={incidents}
            shelters={shelters}
            resources={resources}
            activeLayers={activeLayers} 
            highlightedMarker={highlightedMarker}
            onMapClick={handleMapClick}
          />
        </div>

      </div>
    </div>
  );
}
