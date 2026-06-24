import { fetchConsolidatedData, fetchConsolidatedDataByCity } from "./weather";

export interface FloodRiskData {
  score: number;
  status: "Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk";
  colorClass: string;
  reasoning: string;
}

export function getFloodRiskDetails(score: number, rainSum: number, weatherCode: number): {
  status: "Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk";
  colorClass: string;
  reasoning: string;
} {
  let status: "Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk" = "Low Risk";
  let colorClass = "bg-green-100 text-green-800";
  let reasoning = "Slight chance of minor flooding; dry conditions forecasted.";

  if (score <= 25) {
    status = "Low Risk";
    colorClass = "bg-green-100 text-green-800";
    reasoning = rainSum > 0 
      ? `Minimal risk; only light rain of ${rainSum.toFixed(1)}mm expected.`
      : "Low risk; dry weather conditions forecasted.";
  } else if (score <= 50) {
    status = "Moderate Risk";
    colorClass = "bg-yellow-100 text-yellow-800";
    reasoning = `Moderate pooling possible; ${rainSum.toFixed(1)}mm rain expected.`;
  } else if (score <= 75) {
    status = "High Risk";
    colorClass = "bg-orange-100 text-orange-800";
    reasoning = `Heavy rainfall of ${rainSum.toFixed(1)}mm expected within 24 hours.`;
  } else {
    status = "Critical Risk";
    colorClass = "bg-red-100 text-red-800 animate-pulse";
    reasoning = `Severe storms & ${rainSum.toFixed(1)}mm rainfall imminent. Evacuation routes active.`;
  }

  return { status, colorClass, reasoning };
}

export async function fetchFloodRisk(lat: number, lon: number): Promise<FloodRiskData> {
  const data = await fetchConsolidatedData(lat, lon);
  const current = data.current;
  const forecast = data.forecast;

  if (!current || !forecast || !forecast.list) {
    throw new Error("Invalid response format from weather forecast API");
  }

  // Sum next 24 hours of rain forecast (first 8 entries of 3-hourly forecast)
  const first24h = forecast.list.slice(0, 8);
  const rain24hSum = first24h.reduce((sum: number, item: any) => sum + (item.rain?.["3h"] || 0), 0);

  // 1. Rainfall forecast component (0-50 pts)
  // Scale rain sum: 1mm = 1.5 points, max 50 points (capped at ~33mm)
  const rainPoints = Math.min(rain24hSum * 1.5, 50);

  // 2. Humidity component (0-25 pts)
  const humidity = current.main.humidity ?? 0;
  const humidityPoints = (humidity / 100) * 25;

  // 3. Weather condition component (0-25 pts)
  const code = current.weather[0]?.id ?? 800;
  let weatherPoints = 0;
  if (code >= 200 && code < 300) {
    weatherPoints = 25; // Thunderstorms
  } else if ([502, 503, 504, 522].includes(code)) {
    weatherPoints = 20; // Heavy / violent rain
  } else if ([501, 521].includes(code)) {
    weatherPoints = 15; // Moderate rain
  } else if ([500, 520].includes(code) || (code >= 300 && code < 400)) {
    weatherPoints = 10; // Light rain / drizzle
  } else if (code >= 600 && code < 700) {
    weatherPoints = 5; // Snow
  }

  const rawScore = rainPoints + humidityPoints + weatherPoints;
  const score = Math.min(Math.max(Math.round(rawScore), 0), 100);

  const { status, colorClass, reasoning } = getFloodRiskDetails(score, rain24hSum, code);

  return {
    score,
    status,
    colorClass,
    reasoning,
  };
}

export async function fetchFloodRiskByCity(city: string): Promise<FloodRiskData> {
  const data = await fetchConsolidatedDataByCity(city);
  const current = data.current;
  const forecast = data.forecast;

  if (!current || !forecast || !forecast.list) {
    throw new Error("Invalid response format from weather forecast API");
  }

  // Sum next 24 hours of rain forecast (first 8 entries of 3-hourly forecast)
  const first24h = forecast.list.slice(0, 8);
  const rain24hSum = first24h.reduce((sum: number, item: any) => sum + (item.rain?.["3h"] || 0), 0);

  // 1. Rainfall forecast component (0-50 pts)
  // Scale rain sum: 1mm = 1.5 points, max 50 points (capped at ~33mm)
  const rainPoints = Math.min(rain24hSum * 1.5, 50);

  // 2. Humidity component (0-25 pts)
  const humidity = current.main.humidity ?? 0;
  const humidityPoints = (humidity / 100) * 25;

  // 3. Weather condition component (0-25 pts)
  const code = current.weather[0]?.id ?? 800;
  let weatherPoints = 0;
  if (code >= 200 && code < 300) {
    weatherPoints = 25; // Thunderstorms
  } else if ([502, 503, 504, 522].includes(code)) {
    weatherPoints = 20; // Heavy / violent rain
  } else if ([501, 521].includes(code)) {
    weatherPoints = 15; // Moderate rain
  } else if ([500, 520].includes(code) || (code >= 300 && code < 400)) {
    weatherPoints = 10; // Light rain / drizzle
  } else if (code >= 600 && code < 700) {
    weatherPoints = 5; // Snow
  }

  const rawScore = rainPoints + humidityPoints + weatherPoints;
  const score = Math.min(Math.max(Math.round(rawScore), 0), 100);

  const { status, colorClass, reasoning } = getFloodRiskDetails(score, rain24hSum, code);

  return {
    score,
    status,
    colorClass,
    reasoning,
  };
}
