import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city");

  if (!city && (!lat || !lon)) {
    return NextResponse.json({ error: "Missing coordinates or city parameter" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenWeather API key is not configured" }, { status: 500 });
  }

  try {
    let resolvedLat = lat;
    let resolvedLon = lon;
    let currentData: any = null;

    if (city) {
      const cityUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`;
      const currentRes = await fetch(cityUrl);
      if (currentRes.status === 404) {
        return NextResponse.json({ error: "City not found" }, { status: 404 });
      }
      if (!currentRes.ok) {
        throw new Error(`Current weather API error: ${currentRes.status} ${currentRes.statusText}`);
      }
      currentData = await currentRes.json();
      resolvedLat = currentData.coord.lat.toString();
      resolvedLon = currentData.coord.lon.toString();
    }

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${resolvedLat}&lon=${resolvedLon}&appid=${apiKey}&units=imperial`;
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${resolvedLat}&lon=${resolvedLon}&appid=${apiKey}`;

    const fetchPromises = [];

    if (city && currentData) {
      fetchPromises.push(
        Promise.resolve(currentData),
        fetch(forecastUrl).then(async (res) => {
          if (!res.ok) throw new Error(`Forecast API error: ${res.status} ${res.statusText}`);
          return res.json();
        }),
        fetch(airQualityUrl).then(async (res) => {
          if (!res.ok) throw new Error(`Air pollution API error: ${res.status} ${res.statusText}`);
          return res.json();
        })
      );
    } else {
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${resolvedLat}&lon=${resolvedLon}&appid=${apiKey}&units=imperial`;
      fetchPromises.push(
        fetch(currentUrl).then(async (res) => {
          if (!res.ok) throw new Error(`Current weather API error: ${res.status} ${res.statusText}`);
          return res.json();
        }),
        fetch(forecastUrl).then(async (res) => {
          if (!res.ok) throw new Error(`Forecast API error: ${res.status} ${res.statusText}`);
          return res.json();
        }),
        fetch(airQualityUrl).then(async (res) => {
          if (!res.ok) throw new Error(`Air pollution API error: ${res.status} ${res.statusText}`);
          return res.json();
        })
      );
    }

    const [finalCurrent, finalForecast, finalAirQuality] = await Promise.all(fetchPromises);

    return NextResponse.json(
      { current: finalCurrent, forecast: finalForecast, airQuality: finalAirQuality },
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

