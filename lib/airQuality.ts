import { fetchConsolidatedData, fetchConsolidatedDataByCity } from "./weather";

export interface AirQualityData {
  usAqi: number;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  ozone: number;
  status: "Good" | "Moderate" | "Poor" | "Hazardous";
  colorClass: string;
}

export function getAQIDetails(aqi: number): {
  status: "Good" | "Moderate" | "Poor" | "Hazardous";
  colorClass: string;
} {
  if (aqi <= 50) {
    return { status: "Good", colorClass: "bg-green-100 text-green-800" };
  } else if (aqi <= 100) {
    return { status: "Moderate", colorClass: "bg-yellow-100 text-yellow-800" };
  } else if (aqi <= 150) {
    return { status: "Poor", colorClass: "bg-orange-100 text-orange-800" };
  } else if (aqi <= 200) {
    return { status: "Poor", colorClass: "bg-red-100 text-red-800" };
  } else {
    return { status: "Hazardous", colorClass: "bg-purple-100 text-purple-800" };
  }
}

// Helper to calculate US AQI from PM2.5 concentration using standard EPA breakpoints
function calculatePM25AQI(pm25: number): number {
  if (pm25 <= 12) return Math.round((50 / 12) * pm25);
  if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
  if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
  if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
  if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
  if (pm25 <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301);
  if (pm25 <= 500.4) return Math.round(((500 - 401) / (500.4 - 350.5)) * (pm25 - 350.5) + 401);
  return 500;
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  const data = await fetchConsolidatedData(lat, lon);
  const airQuality = data.airQuality;

  if (!airQuality || !airQuality.list || airQuality.list.length === 0) {
    throw new Error("Invalid response format from air quality API");
  }

  const current = airQuality.list[0];
  const pm25 = Math.round(current.components.pm2_5 ?? 0);
  const pm10 = Math.round(current.components.pm10 ?? 0);
  const co = Math.round(current.components.co ?? 0);
  const no2 = Math.round(current.components.no2 ?? 0);
  const ozone = Math.round(current.components.o3 ?? 0);

  const usAqi = calculatePM25AQI(pm25);
  const { status, colorClass } = getAQIDetails(usAqi);

  return {
    usAqi,
    pm25,
    pm10,
    co,
    no2,
    ozone,
    status,
    colorClass,
  };
}

export async function fetchAirQualityByCity(city: string): Promise<AirQualityData> {
  const data = await fetchConsolidatedDataByCity(city);
  const airQuality = data.airQuality;

  if (!airQuality || !airQuality.list || airQuality.list.length === 0) {
    throw new Error("Invalid response format from air quality API");
  }

  const current = airQuality.list[0];
  const pm25 = Math.round(current.components.pm2_5 ?? 0);
  const pm10 = Math.round(current.components.pm10 ?? 0);
  const co = Math.round(current.components.co ?? 0);
  const no2 = Math.round(current.components.no2 ?? 0);
  const ozone = Math.round(current.components.o3 ?? 0);

  const usAqi = calculatePM25AQI(pm25);
  const { status, colorClass } = getAQIDetails(usAqi);

  return {
    usAqi,
    pm25,
    pm10,
    co,
    no2,
    ozone,
    status,
    colorClass,
  };
}
