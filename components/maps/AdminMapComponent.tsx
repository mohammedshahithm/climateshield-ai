"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

// Fix standard leaflet icon issue
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (htmlContent: string) => {
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: htmlContent,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const iconSvgWrapper = (color: string, iconHtml: string) => `
  <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
    ${iconHtml}
  </div>
`;

// Specific icons for Admin
const incidentIcon = createCustomIcon(iconSvgWrapper('#ef4444', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>'));
const ambulanceIcon = createCustomIcon(iconSvgWrapper('#f97316', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle><path d="M9 10h4"></path><path d="M11 8v4"></path></svg>'));
const rescueIcon = createCustomIcon(iconSvgWrapper('#8b5cf6', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>'));
const shelterIcon = createCustomIcon(iconSvgWrapper('#3b82f6', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'));

export type AdminMarker = {
  id: string;
  type: "Incident" | "Ambulance" | "Rescue" | "Shelter";
  name: string;
  lat: number;
  lng: number;
  details: string;
};

const getIconForType = (type: string) => {
  if (type === "Incident") return incidentIcon;
  if (type === "Ambulance") return ambulanceIcon;
  if (type === "Rescue") return rescueIcon;
  return shelterIcon;
};

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

interface AdminMapProps {
  markers: AdminMarker[];
  center: [number, number];
}

export default function AdminMapComponent({ markers, center }: AdminMapProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-full w-full min-h-[400px] relative z-0 rounded-xl overflow-hidden">
      <MapContainer 
        center={center} 
        zoom={11} 
        className="h-full w-full absolute inset-0 z-0"
        zoomControl={true}
        scrollWheelZoom={false}
        dragging={true}
      >
        <MapResizeFix center={center} />
        
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {markers.map((marker) => (
          <Marker 
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={getIconForType(marker.type)}
          >
            <Popup>
              <div className="min-w-[150px]">
                <h4 className="font-bold text-gray-900 mb-1">{marker.name}</h4>
                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 bg-gray-100 text-gray-600">
                  {marker.type}
                </div>
                <p className="text-xs text-gray-600 leading-tight">{marker.details}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
