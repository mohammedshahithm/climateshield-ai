"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface CityLocation {
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
}

export const PREDEFINED_CITIES: CityLocation[] = [
  { name: "Chennai", latitude: 13.0827, longitude: 80.2707, region: "Tamil Nadu", country: "India" },
  { name: "Mumbai", latitude: 19.0760, longitude: 72.8777, region: "Maharashtra", country: "India" },
  { name: "Delhi", latitude: 28.7041, longitude: 77.1025, region: "Delhi", country: "India" },
  { name: "Bangalore", latitude: 12.9716, longitude: 77.5946, region: "Karnataka", country: "India" },
  { name: "Hyderabad", latitude: 17.3850, longitude: 78.4867, region: "Telangana", country: "India" },
  { name: "Kolkata", latitude: 22.5726, longitude: 88.3639, region: "West Bengal", country: "India" },
];

interface LocationContextType {
  city: string;
  latitude: number;
  longitude: number;
  recentLocations: CityLocation[];
  setLocation: (
    cityName: string,
    latitude: number,
    longitude: number,
    region?: string,
    country?: string
  ) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<string>("Chennai");
  const [latitude, setLatitude] = useState<number>(13.0827);
  const [longitude, setLongitude] = useState<number>(80.2707);
  const [recentLocations, setRecentLocations] = useState<CityLocation[]>(PREDEFINED_CITIES);

  // Safely restore state from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocation = localStorage.getItem("climateshield_location");
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation) as CityLocation;
          if (parsed.name && typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
            setCityState(parsed.name);
            setLatitude(parsed.latitude);
            setLongitude(parsed.longitude);
          }
        } catch (e) {
          console.error("Failed to restore saved location:", e);
        }
      }

      const savedRecent = localStorage.getItem("climateshield_recent_locations");
      if (savedRecent) {
        try {
          const parsed = JSON.parse(savedRecent);
          if (Array.isArray(parsed)) {
            setRecentLocations(parsed);
          }
        } catch (e) {
          console.error("Failed to restore recent locations:", e);
        }
      }
    }
  }, []);

  const setLocation = (
    cityName: string,
    lat: number,
    lon: number,
    region?: string,
    country?: string
  ) => {
    setCityState(cityName);
    setLatitude(lat);
    setLongitude(lon);

    const newLoc: CityLocation = { name: cityName, latitude: lat, longitude: lon, region, country };

    // Save active location to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("climateshield_location", JSON.stringify(newLoc));
    }

    // Update recent locations list
    setRecentLocations(prev => {
      // Remove matching location if already present to prevent duplicate list entries
      const filtered = prev.filter(item => 
        item.name.toLowerCase() !== cityName.toLowerCase() &&
        !(Math.abs(item.latitude - lat) < 0.0001 && Math.abs(item.longitude - lon) < 0.0001)
      );
      
      const updated = [newLoc, ...filtered].slice(0, 6);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("climateshield_recent_locations", JSON.stringify(updated));
      }
      
      return updated;
    });
  };

  return (
    <LocationContext.Provider value={{ city, latitude, longitude, recentLocations, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
