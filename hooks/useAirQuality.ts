import { useState, useEffect, useCallback } from "react";
import { fetchAirQuality, AirQualityData } from "@/lib/airQuality";

// Chennai coordinates fallback
const CHENNAI_LAT = 13.0827;
const CHENNAI_LON = 80.2707;

export interface UseAirQualityResult {
  airQuality: AirQualityData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAirQuality(lat?: number, lon?: number): UseAirQualityResult {
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getAQIData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const fetchAQIWithCoords = async (latitude: number, longitude: number) => {
      try {
        const data = await fetchAirQuality(latitude, longitude);
        setAirQuality(data);
      } catch (err) {
        console.error("Failed to fetch air quality:", err);
        setError(err instanceof Error ? err.message : "Failed to load air quality data");
      } finally {
        setLoading(false);
      }
    };

    // Reuse provided coordinates
    if (lat !== undefined && lon !== undefined) {
      await fetchAQIWithCoords(lat, lon);
      return;
    }

    // Otherwise, request user's geolocation coordinates
    if (typeof window === "undefined" || !navigator.geolocation) {
      await fetchAQIWithCoords(CHENNAI_LAT, CHENNAI_LON);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchAQIWithCoords(latitude, longitude);
      },
      async (geoError) => {
        console.warn("Air Quality location request denied or failed. Defaulting to Chennai.", geoError);
        await fetchAQIWithCoords(CHENNAI_LAT, CHENNAI_LON);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [lat, lon]);

  useEffect(() => {
    getAQIData();
  }, [getAQIData]);

  return {
    airQuality,
    loading,
    error,
    refresh: getAQIData,
  };
}
