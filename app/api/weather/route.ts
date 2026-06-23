import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenWeather API key is not configured" }, { status: 500 });
  }

  try {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    const [currentRes, forecastRes, airQualityRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
      fetch(airQualityUrl),
    ]);

    if (!currentRes.ok) {
      throw new Error(`Current weather API error: ${currentRes.status} ${currentRes.statusText}`);
    }
    if (!forecastRes.ok) {
      throw new Error(`Forecast API error: ${forecastRes.status} ${forecastRes.statusText}`);
    }
    if (!airQualityRes.ok) {
      throw new Error(`Air pollution API error: ${airQualityRes.status} ${airQualityRes.statusText}`);
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();
    const airQuality = await airQualityRes.json();

    return NextResponse.json(
      { current, forecast, airQuality },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  } catch (error: any) {
    console.error("OpenWeather API proxy failed:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch weather data" }, { status: 520 });
  }
}
