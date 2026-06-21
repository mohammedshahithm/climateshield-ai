"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";

export type MapActiveLayers = {
  weather: boolean;
  aligns?: never; // placeholder for TS consistency check if needed
  airQuality: boolean;
  flood: boolean;
  incidents?: boolean;
};

export type RiskMarkerData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  overallRisk: "Low" | "Moderate" | "High" | "Critical";
  score: number; // overall risk score (0-100)
  temperature: number;
  humidity: number;
  aqi: number;
  aqiStatus: string;
  floodRisk: number; // flood risk score (0-100)
  floodRiskStatus: string;
  action: string;
  shelter?: string;
  shelterLat?: number;
  shelterLng?: number;
  isCustom?: boolean;
};

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

// Custom Icons for Incident Categories
const incidentIcons: Record<string, L.DivIcon> = {
  "Flood": L.divIcon({
    className: "incident-leaflet-icon-flood",
    html: `<div style="background-color: #3b82f6; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"></path></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  }),
  "Fire": L.divIcon({
    className: "incident-leaflet-icon-fire",
    html: `<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  }),
  "Power Outage": L.divIcon({
    className: "incident-leaflet-icon-power",
    html: `<div style="background-color: #f59e0b; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  }),
  "Landslide": L.divIcon({
    className: "incident-leaflet-icon-landslide",
    html: `<div style="background-color: #78350f; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  }),
  "Heat Emergency": L.divIcon({
    className: "incident-leaflet-icon-heat",
    html: `<div style="background-color: #ea580c; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
};

// Helper functions to get icons dynamically
const getIconForRisk = (risk: string, highlighted: boolean) => {
  if (risk === "Low") return createCustomIcon("#10b981", highlighted);
  if (risk === "Moderate") return createCustomIcon("#eab308", highlighted);
  if (risk === "High") return createCustomIcon("#f97316", highlighted);
  return createCustomIcon("#ef4444", highlighted);
};

// Map controls component for centering and lifecycle fixes
function MapResizeFix({ center, highlightedMarker }: { center: [number, number], highlightedMarker: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    map.flyTo(center, 12, { duration: 1.5 });
  }, [center, map]);

  return null;
}

// React-Leaflet Map events component to detect clicks on the map
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapComponentProps {
  center: [number, number];
  markers: RiskMarkerData[];
  incidents?: any[];
  activeLayers: MapActiveLayers;
  highlightedMarker: string | null;
  onMapClick: (lat: number, lng: number) => void;
}

export default function MapComponent({ center, markers, incidents, activeLayers, highlightedMarker, onMapClick }: MapComponentProps) {
  const [mounted, setMounted] = useState(false);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});
  
  useEffect(() => {
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
        <MapClickHandler onMapClick={onMapClick} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((marker) => {
          const isHighlighted = highlightedMarker === marker.id;
          
          // Weather circle color
          const weatherColor = marker.temperature > 95 ? '#ef4444' :
                               marker.temperature > 80 ? '#fbbf24' :
                               marker.temperature > 55 ? '#10b981' : '#3b82f6';
                               
          // AQI circle color
          const aqiColor = marker.aqiStatus === 'Hazardous' || marker.aqi > 150 ? '#a855f7' :
                           marker.aqiStatus === 'Poor' || marker.aqi > 100 ? '#f97316' :
                           marker.aqiStatus === 'Moderate' || marker.aqi > 50 ? '#fbbf24' : '#10b981';

          // Flood circle color
          const floodColor = marker.floodRiskStatus === 'Critical Risk' || marker.floodRisk > 75 ? '#ef4444' :
                             marker.floodRiskStatus === 'High Risk' || marker.floodRisk > 50 ? '#f97316' :
                             marker.floodRiskStatus === 'Moderate Risk' || marker.floodRisk > 25 ? '#fbbf24' : '#10b981';

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
                  <div className="min-w-[240px] text-gray-800">
                    <h3 className="font-bold text-gray-900 text-base mb-1 border-b pb-1 flex items-center justify-between gap-2">
                      <span className="truncate max-w-[180px]">{marker.name}</span>
                      {isHighlighted && <span className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse shrink-0" />}
                    </h3>
                    
                    <div className="flex justify-between items-center my-2">
                      <span className="text-sm font-semibold text-gray-500">Overall Risk:</span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        marker.overallRisk === "Low" ? "bg-green-100 text-green-700" :
                        marker.overallRisk === "Moderate" ? "bg-yellow-100 text-yellow-700" :
                        marker.overallRisk === "High" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>{marker.overallRisk.toUpperCase()} ({marker.score}/100)</span>
                    </div>
                    
                    <div className="space-y-1.5 text-xs my-2 border-b pb-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Temperature:</span> 
                        <span className="font-bold text-gray-900">{marker.temperature}°F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Humidity:</span> 
                        <span className="font-bold text-gray-900">{marker.humidity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Air Quality (AQI):</span> 
                        <span className="font-bold text-gray-900">{marker.aqi} ({marker.aqiStatus})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Flood Risk:</span> 
                        <span className="font-bold text-gray-900">{marker.floodRisk}% ({marker.floodRiskStatus})</span>
                      </div>
                      {marker.shelter && (
                        <div className="flex justify-between mt-1 pt-1 border-t border-gray-100">
                          <span className="text-gray-500 font-medium">Nearest Shelter:</span> 
                          <span className="font-semibold text-blue-600 truncate max-w-[120px]">{marker.shelter}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Recommended Action</span>
                      <p className="text-xs font-semibold text-gray-700 leading-tight">{marker.action}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Shelter Marker if present */}
              {marker.shelter && marker.shelterLat && marker.shelterLng && (
                <Marker
                  position={[marker.shelterLat, marker.shelterLng]}
                  icon={shelterIcon}
                >
                  <Popup>
                    <div className="text-sm min-w-[160px]">
                      <h4 className="font-bold text-blue-600 mb-0.5">{marker.shelter}</h4>
                      <p className="text-xs text-gray-600">Designated Emergency Safe Hub</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Data Overlay Circles based on Active Layers */}
              {activeLayers.weather && (
                <Circle 
                  center={[marker.lat, marker.lng]} 
                  radius={1200} 
                  pathOptions={{ color: weatherColor, fillColor: weatherColor, fillOpacity: 0.15, weight: 1.5 }} 
                />
              )}
              {activeLayers.airQuality && (
                <Circle 
                  center={[marker.lat, marker.lng]} 
                  radius={1800} 
                  pathOptions={{ color: aqiColor, fillColor: aqiColor, fillOpacity: 0.15, weight: 1.5 }} 
                />
              )}
              {activeLayers.flood && (
                <Circle 
                  center={[marker.lat, marker.lng]} 
                  radius={1500} 
                  pathOptions={{ color: floodColor, fillColor: floodColor, fillOpacity: 0.15, weight: 1.5 }} 
                />
              )}
            </div>
          );
        })}
        {/* Render incident markers if layer is active */}
        {activeLayers.incidents !== false && incidents && incidents.map((incident) => {
          const icon = incidentIcons[incident.category] || incidentIcons["Flood"];
          return (
            <Marker 
              key={incident.id} 
              position={[incident.latitude, incident.longitude]} 
              icon={icon}
            >
              <Popup>
                <div className="min-w-[220px] text-gray-800 font-sans">
                  <div className="flex justify-between items-start gap-2 mb-1.5 border-b pb-1.5 border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm truncate max-w-[130px]">{incident.title}</h3>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border uppercase shrink-0 ${
                      incident.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      incident.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>{incident.status}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2.5 leading-relaxed">{incident.description}</p>
                  
                  <div className="space-y-1 text-[10px] text-gray-500 border-t pt-1.5 border-gray-50">
                    <div className="flex justify-between">
                      <span className="font-medium">Category:</span>
                      <span className="font-bold text-gray-700">{incident.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Location:</span>
                      <span className="font-bold text-gray-700 truncate max-w-[110px]" title={incident.location_name}>{incident.location_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Reported:</span>
                      <span className="font-bold text-gray-700">
                        {new Date(incident.created_at).toLocaleDateString()} {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
