import { useState, useEffect, useCallback } from "react";
import { fetchWeather, WeatherData } from "@/lib/weather";

// Chennai, India coordinates as default fallback
const CHENNAI_LAT = 13.0827;
const CHENNAI_LON = 80.2707;

export interface UseWeatherResult {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useWeather(lat?: number, lon?: number): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getWeatherData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const fetchWeatherWithCoords = async (latitude: number, longitude: number) => {
      try {
        const data = await fetchWeather(latitude, longitude);
        setWeather(data);
      } catch (err) {
        console.error("Failed to fetch weather:", err);
        setError(err instanceof Error ? err.message : "Failed to load weather data");
      } finally {
        setLoading(false);
      }
    };

    if (lat !== undefined && lon !== undefined) {
      await fetchWeatherWithCoords(lat, lon);
      return;
    }

    // Default to Chennai, India if coordinates are not provided
    await fetchWeatherWithCoords(CHENNAI_LAT, CHENNAI_LON);
  }, [lat, lon]);

  useEffect(() => {
    getWeatherData();
  }, [getWeatherData]);

  return {
    weather,
    loading,
    error,
    refresh: getWeatherData,
  };
}
