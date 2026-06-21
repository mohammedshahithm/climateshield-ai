"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "@/providers/LocationContext";

// Fix for leaflet map sizing and coordinate centering updates
function MapResizeFix({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export default function AIForecastMap() {
  const { latitude, longitude } = useLocation();
  const center: [number, number] = [latitude, longitude];

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={11}
        className="h-full w-full z-0"
        zoomControl={true}
      >
        <MapResizeFix center={center} />
        
        {/* Dark style tile layer for a more "AI/Tech" feel, falling back to standard if needed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Heatwave Expansion - Large diffuse circle */}
        <Circle 
          center={[latitude - 0.0327, longitude - 0.0507]} 
          radius={6000} 
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 1, dashArray: '5, 5' }}
        >
          <Popup>
            <div className="text-sm min-w-[200px]">
              <strong className="text-red-600 block mb-2 text-base">Heatwave Expansion Zone</strong>
              <p className="mb-1 text-gray-700"><strong>Forecast:</strong> Projected 72hr expansion</p>
              <p className="mb-1 text-gray-700"><strong>Risk Score:</strong> 85/100 (Critical)</p>
              <p className="mb-1 text-gray-700"><strong>Confidence:</strong> 92%</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-900 uppercase">Recommendation:</p>
                <p className="text-xs text-gray-600">Deploy cooling centers in affected wards immediately.</p>
              </div>
            </div>
          </Popup>
        </Circle>

        {/* Current High Risk - Solid orange */}
        <Circle 
          center={[latitude - 0.1073, longitude - 0.0501]} // Velachery offset
          radius={1500} 
          pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.4, weight: 2 }}
        >
          <Popup>
            <div className="text-sm min-w-[200px]">
              <strong className="text-orange-600 block mb-2 text-base">Current High Risk</strong>
              <p className="mb-1 text-gray-700"><strong>Status:</strong> Active localized flooding.</p>
              <p className="mb-1 text-gray-700"><strong>Risk Score:</strong> 72/100 (High)</p>
              <p className="mb-1 text-gray-700"><strong>Confidence:</strong> 98%</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-900 uppercase">Recommendation:</p>
                <p className="text-xs text-gray-600">Dispatch rescue squad alpha to low-lying sectors.</p>
              </div>
            </div>
          </Popup>
        </Circle>

        {/* Predicted Critical Risk - Solid Red */}
        <Circle 
          center={[latitude + 0.0173, longitude + 0.0093]} // North Chennai offset
          radius={2000} 
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.5, weight: 2 }}
        >
          <Popup>
            <div className="text-sm min-w-[200px]">
              <strong className="text-red-600 block mb-2 text-base">Predicted Critical Zone</strong>
              <p className="mb-1 text-gray-700"><strong>Forecast:</strong> Tidal surge + Heavy Rain.</p>
              <p className="mb-1 text-gray-700"><strong>Risk Score:</strong> 90/100 (Critical)</p>
              <p className="mb-1 text-gray-700"><strong>Confidence:</strong> 88%</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-900 uppercase">Recommendation:</p>
                <p className="text-xs text-gray-600">Pre-emptive evacuation required within 24 hours.</p>
              </div>
            </div>
          </Popup>
        </Circle>

        {/* Moderate Risk - Yellow */}
        <Circle 
          center={[latitude - 0.0627, longitude - 0.0907]} 
          radius={2500} 
          pathOptions={{ color: '#eab308', fillColor: '#eab308', fillOpacity: 0.3, weight: 2 }}
        >
          <Popup>
            <div className="text-sm min-w-[200px]">
              <strong className="text-yellow-600 block mb-2 text-base">Moderate Risk</strong>
              <p className="mb-1 text-gray-700"><strong>Forecast:</strong> Infrastructure strain.</p>
              <p className="mb-1 text-gray-700"><strong>Risk Score:</strong> 45/100 (Moderate)</p>
              <p className="mb-1 text-gray-700"><strong>Confidence:</strong> 82%</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-900 uppercase">Recommendation:</p>
                <p className="text-xs text-gray-600">Monitor drainage capacities hourly.</p>
              </div>
            </div>
          </Popup>
        </Circle>
        
        {/* Low Risk / Safe Zone - Green */}
        <Circle 
          center={[latitude - 0.1627, longitude - 0.1407]} 
          radius={3000} 
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 2 }}
        >
          <Popup>
            <div className="text-sm min-w-[200px]">
              <strong className="text-green-600 block mb-2 text-base">Stable Zone</strong>
              <p className="mb-1 text-gray-700"><strong>Forecast:</strong> No immediate threats.</p>
              <p className="mb-1 text-gray-700"><strong>Risk Score:</strong> 15/100 (Low)</p>
              <p className="mb-1 text-gray-700"><strong>Confidence:</strong> 95%</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-900 uppercase">Recommendation:</p>
                <p className="text-xs text-gray-600">Use as staging area for emergency resources.</p>
              </div>
            </div>
          </Popup>
        </Circle>

      </MapContainer>
    </div>
  );
}
