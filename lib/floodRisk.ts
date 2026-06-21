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
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=rain,relative_humidity_2m,weather_code&hourly=rain&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch weather forecast data: ${res.statusText}`);
  }

  const data = await res.json();
  const current = data.current;
  const hourly = data.hourly;

  if (!current || !hourly || !hourly.rain) {
    throw new Error("Invalid response format from weather forecast API");
  }

  // Sum next 24 hours of rain forecast (in mm)
  const rain24hSum = hourly.rain.slice(0, 24).reduce((sum: number, val: number) => sum + (val || 0), 0);

  // 1. Rainfall forecast component (0-50 pts)
  // Scale rain sum: 1mm = 1.5 points, max 50 points (capped at ~33mm)
  const rainPoints = Math.min(rain24hSum * 1.5, 50);

  // 2. Humidity component (0-25 pts)
  const humidity = current.relative_humidity_2m ?? 0;
  const humidityPoints = (humidity / 100) * 25;

  // 3. Weather condition component (0-25 pts)
  const code = current.weather_code ?? 0;
  let weatherPoints = 0;
  if ([95, 96, 99].includes(code)) {
    weatherPoints = 25; // Thunderstorms
  } else if ([65, 82].includes(code)) {
    weatherPoints = 20; // Heavy / violent rain
  } else if ([63, 81].includes(code)) {
    weatherPoints = 15; // Moderate rain
  } else if ([61, 80, 55].includes(code)) {
    weatherPoints = 10; // Light rain / dense drizzle
  } else if ([51, 53, 56, 57, 66, 67].includes(code)) {
    weatherPoints = 5; // Other drizzle/freezing rain
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
