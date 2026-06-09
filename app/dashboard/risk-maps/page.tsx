"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  Search, ShieldAlert, Droplets, ThermometerSun, 
  Wind, ActivitySquare, Users, Home, MapPin
} from "lucide-react";

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

export type MapActiveLayers = {
  flood: boolean;
  heat: boolean;
  airQuality: boolean;
  infra: boolean;
};

import type { RiskMarkerData } from "@/components/maps/MapComponent";

// Expanded Mock Data
export const mockMarkers: RiskMarkerData[] = [
  {
    id: "m1",
    name: "Anna Nagar",
    lat: 13.0850,
    lng: 80.2100,
    overallRisk: "Moderate",
    score: 55,
    floodRisk: "High",
    heatRisk: "Moderate",
    airQualityRisk: "Moderate",
    infraRisk: "High",
    shelter: "Anna Nagar Tower Park Hub",
    shelterLat: 13.0840,
    shelterLng: 80.2110,
    action: "Clear storm drains and prepare sandbags."
  },
  {
    id: "m2",
    name: "Velachery",
    lat: 12.9754,
    lng: 80.2206,
    overallRisk: "Critical",
    score: 85,
    floodRisk: "Critical",
    heatRisk: "High",
    airQualityRisk: "Low",
    infraRisk: "Critical",
    shelter: "Velachery Aquatic Complex",
    shelterLat: 12.9720,
    shelterLng: 80.2215,
    action: "Immediate evacuation routes planning required."
  },
  {
    id: "m3",
    name: "Adyar",
    lat: 13.0033,
    lng: 80.2555,
    overallRisk: "Low",
    score: 25,
    floodRisk: "Low",
    heatRisk: "Moderate",
    airQualityRisk: "Low",
    infraRisk: "Low",
    shelter: "Adyar Indoor Stadium",
    shelterLat: 13.0010,
    shelterLng: 80.2540,
    action: "Maintain baseline preparedness. No immediate threat."
  },
  {
    id: "m5",
    name: "T Nagar",
    lat: 13.0418,
    lng: 80.2341,
    overallRisk: "High",
    score: 72,
    floodRisk: "Moderate",
    heatRisk: "Critical",
    airQualityRisk: "High",
    infraRisk: "Moderate",
    shelter: "Panagal Park Community Hall",
    shelterLat: 13.0430,
    shelterLng: 80.2360,
    action: "Deploy urban cooling misting stations."
  }
];

export default function RiskMapsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [center, setCenter] = useState<[number, number]>([13.0827, 80.2707]);
  const [highlightedMarker, setHighlightedMarker] = useState<string | null>(null);
  
  const [activeLayers, setActiveLayers] = useState<MapActiveLayers>({
    flood: true,
    heat: false,
    airQuality: false,
    infra: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase();
    const found = mockMarkers.find(m => m.name.toLowerCase().includes(query));
    if (found) {
      setCenter([found.lat, found.lng]);
      setHighlightedMarker(found.id);
    } else {
      alert("Location not found. Try 'Velachery' or 'T Nagar'.");
      setHighlightedMarker(null);
    }
  };

  const stats = useMemo(() => {
    return {
      highRisk: mockMarkers.filter(m => m.overallRisk === "High" || m.overallRisk === "Critical").length,
      moderate: mockMarkers.filter(m => m.overallRisk === "Moderate").length,
      shelters: mockMarkers.length,
      protected: "42,500"
    };
  }, []);

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
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><ShieldAlert className="h-5 w-5" /></div>
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
              <p className="text-xs text-gray-500 font-medium uppercase">Shelters</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{stats.shelters} Active</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Users className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Protected</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{stats.protected}</p>
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
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Location Search</h3>
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search area..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            </form>
          </div>

          {/* Layer Toggles */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Risk Layers</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Flood Risk
                </div>
                <input type="checkbox" checked={activeLayers.flood} onChange={(e) => setActiveLayers({...activeLayers, flood: e.target.checked})} className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ThermometerSun className="h-4 w-4 text-orange-500" />
                  Heat Risk
                </div>
                <input type="checkbox" checked={activeLayers.heat} onChange={(e) => setActiveLayers({...activeLayers, heat: e.target.checked})} className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Wind className="h-4 w-4 text-gray-500" />
                  Air Quality
                </div>
                <input type="checkbox" checked={activeLayers.airQuality} onChange={(e) => setActiveLayers({...activeLayers, airQuality: e.target.checked})} className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ActivitySquare className="h-4 w-4 text-purple-500" />
                  Infrastructure
                </div>
                <input type="checkbox" checked={activeLayers.infra} onChange={(e) => setActiveLayers({...activeLayers, infra: e.target.checked})} className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
              </label>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Map Markers</h4>
              <div className="space-y-2 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm" /> Low Risk Zone</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 border border-white shadow-sm" /> Moderate Risk Zone</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-sm" /> High Risk Zone</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" /> Critical Risk Zone</div>
                <div className="flex items-center gap-2 mt-2"><Home className="h-3.5 w-3.5 text-blue-500" /> Emergency Shelter</div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container Area */}
        {/* We use relative positioning and z-0 so Leaflet's stacking context works without overlapping header */}
        <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative min-h-[400px] z-0">
          <MapComponent 
            center={center} 
            markers={mockMarkers} 
            activeLayers={activeLayers} 
            highlightedMarker={highlightedMarker}
          />
        </div>

      </div>
    </div>
  );
}
