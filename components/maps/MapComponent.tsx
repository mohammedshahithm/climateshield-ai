"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import type { MapActiveLayers } from "@/app/dashboard/risk-maps/page";

// Fix standard leaflet icon issue
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons for Risk Levels
const createCustomIcon = (color: string, isHighlighted: boolean) => {
  const shadow = isHighlighted ? `0 0 0 4px rgba(0,0,0,0.1), 0 0 15px ${color}` : `0 2px 4px rgba(0,0,0,0.3)`;
  const size = isHighlighted ? 32 : 24;
  const offset = size / 2;

  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: ${shadow}; transition: all 0.3s ease;"></div>`,
    iconSize: [size, size],
    iconAnchor: [offset, offset],
    popupAnchor: [0, -offset],
  });
};

const shelterIcon = L.divIcon({
  className: "shelter-leaflet-icon",
  html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

// Helper functions to get icons dynamically
const getIconForRisk = (risk: string, highlighted: boolean) => {
  if (risk === "Low") return createCustomIcon("#10b981", highlighted);
  if (risk === "Moderate") return createCustomIcon("#eab308", highlighted);
  if (risk === "High") return createCustomIcon("#f97316", highlighted);
  return createCustomIcon("#ef4444", highlighted);
};

// Map controls component for centering and lifecycle fixes
function MapResizeFix({ center }: { center: [number, number], highlightedMarker: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);

  return null;
}

export type RiskMarkerData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  overallRisk: "Low" | "Moderate" | "High" | "Critical";
  score: number;
  floodRisk: string;
  heatRisk: string;
  airQualityRisk: string;
  infraRisk: string;
  shelter: string;
  shelterLat: number;
  shelterLng: number;
  action: string;
};

interface MapComponentProps {
  center: [number, number];
  markers: RiskMarkerData[];
  activeLayers: MapActiveLayers;
  highlightedMarker: string | null;
}

export default function MapComponent({ center, markers, activeLayers, highlightedMarker }: MapComponentProps) {
  const [mounted, setMounted] = useState(false);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (highlightedMarker && markerRefs.current[highlightedMarker]) {
       markerRefs.current[highlightedMarker].openPopup();
    }
  }, [highlightedMarker]);

  if (!mounted) return null;

  return (
    <div className="h-full w-full min-h-[700px] relative z-0">
      <MapContainer 
        center={center} 
        zoom={12} 
        className="h-full w-full absolute inset-0 z-0"
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
      >
        <MapResizeFix center={center} highlightedMarker={highlightedMarker} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((marker) => {
          const isHighlighted = highlightedMarker === marker.id;
          
          return (
            <div key={marker.id}>
              {/* Main Risk Marker */}
              <Marker 
                position={[marker.lat, marker.lng]}
                icon={getIconForRisk(marker.overallRisk, isHighlighted)}
                zIndexOffset={isHighlighted ? 1000 : 0}
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[marker.id] = ref;
                  }
                }}
              >
                <Popup>
                  <div className="min-w-[220px]">
                    <h3 className="font-bold text-gray-900 text-base mb-1 border-b pb-1 flex items-center gap-2">
                      {marker.name}
                      {isHighlighted && <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />}
                    </h3>
                    
                    <div className="flex justify-between items-center my-2">
                      <span className="text-sm font-medium text-gray-500">Risk Score:</span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                        marker.overallRisk === "Low" ? "bg-green-100 text-green-700" :
                        marker.overallRisk === "Moderate" ? "bg-yellow-100 text-yellow-700" :
                        marker.overallRisk === "High" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>{marker.score}/100</span>
                    </div>
                    
                    <div className="space-y-1.5 text-xs text-gray-600 my-2">
                      <div className="flex justify-between"><span>Risk Category:</span> <span className="font-bold text-gray-900">{marker.overallRisk.toUpperCase()}</span></div>
                      {activeLayers.flood && <div className="flex justify-between"><span>Flood Risk:</span> <span className="font-medium text-gray-900">{marker.floodRisk}</span></div>}
                      {activeLayers.heat && <div className="flex justify-between"><span>Heat Risk:</span> <span className="font-medium text-gray-900">{marker.heatRisk}</span></div>}
                      {activeLayers.airQuality && <div className="flex justify-between"><span>Air Quality:</span> <span className="font-medium text-gray-900">{marker.airQualityRisk}</span></div>}
                      {activeLayers.infra && <div className="flex justify-between"><span>Infrastructure:</span> <span className="font-medium text-gray-900">{marker.infraRisk}</span></div>}
                      <div className="flex justify-between mt-1 pt-1 border-t border-gray-100">
                        <span>Nearest Shelter:</span> 
                        <span className="font-medium text-blue-600">{marker.shelter}</span>
                      </div>
                    </div>

                    <div className="mt-3 bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Recommended Action</span>
                      <p className="text-xs font-medium text-gray-800 leading-tight">{marker.action}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Shelter Marker */}
              <Marker
                position={[marker.shelterLat, marker.shelterLng]}
                icon={shelterIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <h4 className="font-bold text-blue-600 mb-1">{marker.shelter}</h4>
                    <p className="text-xs text-gray-600">Designated Safe Zone for {marker.name}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Data Overlay Circles based on Active Layers */}
              {activeLayers.flood && (marker.floodRisk === "High" || marker.floodRisk === "Critical") && (
                <Circle 
                  center={[marker.lat, marker.lng]} 
                  radius={marker.floodRisk === "Critical" ? 1500 : 1000} 
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 1 }} 
                />
              )}
              {activeLayers.heat && (marker.heatRisk === "High" || marker.heatRisk === "Critical") && (
                <Circle 
                  center={[marker.lat, marker.lng]} 
                  radius={marker.heatRisk === "Critical" ? 1800 : 1200} 
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 1 }} 
                />
              )}
              {activeLayers.airQuality && (marker.airQualityRisk === "High" || marker.airQualityRisk === "Critical") && (
                <Circle 
                  center={[marker.lat, marker.lng]} 
                  radius={2000} 
                  pathOptions={{ color: '#6b7280', fillColor: '#6b7280', fillOpacity: 0.2, weight: 1 }} 
                />
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
