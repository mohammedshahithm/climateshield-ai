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

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch air quality data: ${res.statusText}`);
  }

  const data = await res.json();
  const current = data.current;

  if (!current) {
    throw new Error("Invalid response format from air quality API");
  }

  const usAqi = current.us_aqi ?? 0;
  const { status, colorClass } = getAQIDetails(usAqi);

  return {
    usAqi: Math.round(usAqi),
    pm25: Math.round(current.pm2_5 ?? 0),
    pm10: Math.round(current.pm10 ?? 0),
    co: Math.round(current.carbon_monoxide ?? 0),
    no2: Math.round(current.nitrogen_dioxide ?? 0),
    ozone: Math.round(current.ozone ?? 0),
    status,
    colorClass,
  };
}
