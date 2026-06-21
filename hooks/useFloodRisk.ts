import { useState, useEffect, useCallback } from "react";
import { fetchFloodRisk, FloodRiskData } from "@/lib/floodRisk";

// Chennai coordinates fallback
const CHENNAI_LAT = 13.0827;
const CHENNAI_LON = 80.2707;

export interface UseFloodRiskResult {
  floodRisk: FloodRiskData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFloodRisk(lat?: number, lon?: number): UseFloodRiskResult {
  const [floodRisk, setFloodRisk] = useState<FloodRiskData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getFloodRiskData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const fetchRiskWithCoords = async (latitude: number, longitude: number) => {
      try {
        const data = await fetchFloodRisk(latitude, longitude);
        setFloodRisk(data);
      } catch (err) {
        console.error("Failed to fetch flood risk:", err);
        setError(err instanceof Error ? err.message : "Failed to calculate flood risk data");
      } finally {
        setLoading(false);
      }
    };

    // Reuse coordinates if provided
    if (lat !== undefined && lon !== undefined) {
      await fetchRiskWithCoords(lat, lon);
      return;
    }

    // Otherwise, perform geolocation detection
    if (typeof window === "undefined" || !navigator.geolocation) {
      await fetchRiskWithCoords(CHENNAI_LAT, CHENNAI_LON);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchRiskWithCoords(latitude, longitude);
      },
      async (geoError) => {
        console.warn("Flood Risk location request denied or failed. Defaulting to Chennai.", geoError);
        await fetchRiskWithCoords(CHENNAI_LAT, CHENNAI_LON);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [lat, lon]);

  useEffect(() => {
    getFloodRiskData();
  }, [getFloodRiskData]);

  return {
    floodRisk,
    loading,
    error,
    refresh: getFloodRiskData,
  };
}
