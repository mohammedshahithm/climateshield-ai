export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  weatherCode: number;
  condition: string;
  iconName: "Sun" | "Cloud" | "CloudRain" | "CloudLightning" | "CloudSnow";
  locationName: string;
  tomorrowTemperature: number;
  tomorrowWeatherCode: number;
  tomorrowCondition: string;
  tomorrowIconName: "Sun" | "Cloud" | "CloudRain" | "CloudLightning" | "CloudSnow";
  latitude?: number;
  longitude?: number;
  todayMaxTemp?: number;
  todayMinTemp?: number;
  pressure?: number;
  visibility?: number;
}

// Map OpenWeather weather code (IDs) to descriptions and icons
export function getWeatherDetails(code: number): {
  condition: string;
  iconName: "Sun" | "Cloud" | "CloudRain" | "CloudLightning" | "CloudSnow";
} {
  if (code >= 200 && code < 300) {
    return { condition: "Thunderstorm", iconName: "CloudLightning" };
  }
  if (code >= 300 && code < 400) {
    return { condition: "Drizzle", iconName: "CloudRain" };
  }
  if (code >= 500 && code < 600) {
    return { condition: "Rainy", iconName: "CloudRain" };
  }
  if (code >= 600 && code < 700) {
    return { condition: "Snowy", iconName: "CloudSnow" };
  }
  if (code >= 700 && code < 800) {
    return { condition: "Foggy", iconName: "Cloud" };
  }
  if (code === 800) {
    return { condition: "Clear Skies", iconName: "Sun" };
  }
  if (code > 800 && code < 900) {
    return { condition: "Partly Cloudy", iconName: "Cloud" };
  }
  return { condition: "Unknown", iconName: "Cloud" };
}

// Convert wind direction in degrees to compass direction
export function getWindDirection(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Client-side cache helpers
function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const item = sessionStorage.getItem(key);
  if (!item) return null;
  try {
    const parsed = JSON.parse(item);
    const age = Date.now() - parsed.timestamp;
    if (age < 5 * 60 * 1000) { // 5 minutes cache
      return parsed.data as T;
    }
  } catch (e) {
    console.error("Error reading weather cache:", e);
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error("Error writing weather cache:", e);
  }
}

const pendingRequests = new Map<string, Promise<any>>();

// Server-side fetching helper when SSR/Prerendering (since relative URLs fail on the server)
async function fetchConsolidatedDataFromServer(lat: number, lon: number) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not configured on the server");
  }
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
  const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

  const [currentRes, forecastRes, airQualityRes] = await Promise.all([
    fetch(currentUrl),
    fetch(forecastUrl),
    fetch(airQualityUrl),
  ]);

  if (!currentRes.ok || !forecastRes.ok || !airQualityRes.ok) {
    throw new Error("Failed to fetch from OpenWeather APIs on server");
  }

  const current = await currentRes.json();
  const forecast = await forecastRes.json();
  const airQuality = await airQualityRes.json();

  return { current, forecast, airQuality };
}

// Consolidated fetcher supporting client-side caching & deduplication
export async function fetchConsolidatedData(lat: number, lon: number): Promise<any> {
  if (typeof window === "undefined") {
    return fetchConsolidatedDataFromServer(lat, lon);
  }

  const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const storageKey = `weather_cache_${cacheKey}`;

  // 1. Check client cache
  const cached = getCachedData<any>(storageKey);
  if (cached) {
    return cached;
  }

  // 2. Check pending requests
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // 3. Fetch from route proxy
  const promise = (async () => {
    try {
      const url = `/api/weather?lat=${lat}&lon=${lon}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch consolidated weather data: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setCachedData(storageKey, data);
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, promise);
  return promise;
}

// Chennai coordinates
const CHENNAI_LAT = 13.0827;
const CHENNAI_LON = 80.2707;

export async function fetchLocationName(lat: number, lon: number): Promise<string> {
  // Check if coordinates match Chennai
  if (Math.abs(lat - CHENNAI_LAT) < 0.01 && Math.abs(lon - CHENNAI_LON) < 0.01) {
    return "Chennai, India";
  }

  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error("Reverse geocoding failed");
    const data = await res.json();
    
    const city = data.city || data.locality || data.village || data.town;
    const region = data.principalSubdivision;
    const country = data.countryName;

    if (city && region) {
      if (city.toLowerCase() === region.toLowerCase()) {
        return country ? `${city}, ${country}` : city;
      }
      return `${city}, ${region}`;
    } else if (city) {
      return country ? `${city}, ${country}` : city;
    } else if (region) {
      return country ? `${region}, ${country}` : region;
    }
    
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  } catch (error) {
    console.error("Error fetching location name:", error);
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const data = await fetchConsolidatedData(lat, lon);
  const current = data.current;
  const forecast = data.forecast;

  if (!current || !forecast || !forecast.list) {
    throw new Error("Invalid response format from weather API");
  }

  const weatherCode = current.weather[0].id;
  const { condition, iconName } = getWeatherDetails(weatherCode);

  const locationName = current.name ? `${current.name}, ${current.sys.country}` : await fetchLocationName(lat, lon);

  // Tomorrow is 24h later (index 8 in 3-hourly forecast)
  const tomorrowItem = forecast.list.length > 8 ? forecast.list[8] : (forecast.list.length > 0 ? forecast.list[0] : null);
  const tomorrowTemp = tomorrowItem ? Math.round(tomorrowItem.main.temp) : Math.round(current.main.temp - 5);
  const tomorrowCode = tomorrowItem ? tomorrowItem.weather[0].id : 800;
  const { condition: tomorrowCondition, iconName: tomorrowIconName } = getWeatherDetails(tomorrowCode);

  // Compute today's max and min temp from the first 8 items of forecast (next 24 hours)
  let todayMaxTemp = current.main.temp_max;
  let todayMinTemp = current.main.temp_min;
  const first24h = forecast.list.slice(0, 8);
  if (first24h.length > 0) {
    todayMaxTemp = Math.max(...first24h.map((item: any) => item.main.temp_max));
    todayMinTemp = Math.min(...first24h.map((item: any) => item.main.temp_min));
  }

  return {
    temperature: Math.round(current.main.temp),
    humidity: current.main.humidity,
    windSpeed: Math.round(current.wind.speed),
    windDirection: getWindDirection(current.wind.deg),
    weatherCode,
    condition,
    iconName,
    locationName,
    tomorrowTemperature: Math.round(tomorrowTemp),
    tomorrowWeatherCode: tomorrowCode,
    tomorrowCondition,
    tomorrowIconName,
    latitude: lat,
    longitude: lon,
    todayMaxTemp: Math.round(todayMaxTemp),
    todayMinTemp: Math.round(todayMinTemp),
    pressure: current.main.pressure,
    visibility: current.visibility
  };
}

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "ClimateShield-AI/1.0",
        },
        signal: AbortSignal.timeout(7000),
      }
    );

    if (!res.ok) {
      throw new Error(`Geocoding server responded with status: ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error("Invalid coordinates returned from geocoding service");
    }

    const displayName = result.display_name;
    const parts = displayName.split(", ");
    
    const firstPart = parts[0];
    const country = parts[parts.length - 1];
    const region = parts.length > 2 ? parts[parts.length - 2] : undefined;
    const shortName = parts.length > 1 ? `${firstPart}, ${country}` : firstPart;

    return {
      name: shortName,
      latitude: lat,
      longitude: lon,
      region,
      country,
    };
  } catch (error) {
    console.error("Geocoding failed:", error);
    throw error;
  }
}

export async function fetchConsolidatedDataByCity(city: string): Promise<any> {
  if (typeof window === "undefined") {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENWEATHER_API_KEY is not configured on the server");
    }
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`;
    const currentRes = await fetch(currentUrl);
    if (currentRes.status === 404) {
      throw new Error("City not found");
    }
    if (!currentRes.ok) {
      throw new Error(`Current weather API error: ${currentRes.status} ${currentRes.statusText}`);
    }
    const current = await currentRes.json();
    const lat = current.coord.lat;
    const lon = current.coord.lon;

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    const [forecastRes, airQualityRes] = await Promise.all([
      fetch(forecastUrl),
      fetch(airQualityUrl),
    ]);

    if (!forecastRes.ok || !airQualityRes.ok) {
      throw new Error("Failed to fetch from OpenWeather APIs on server");
    }

    const forecast = await forecastRes.json();
    const airQuality = await airQualityRes.json();

    return { current, forecast, airQuality };
  }

  const cacheKey = `city_${city.toLowerCase().trim()}`;
  const storageKey = `weather_cache_${cacheKey}`;

  // 1. Check client cache
  const cached = getCachedData<any>(storageKey);
  if (cached) {
    return cached;
  }

  // 2. Check pending requests
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // 3. Fetch from route proxy
  const promise = (async () => {
    try {
      const url = `/api/weather?city=${encodeURIComponent(city)}`;
      const res = await fetch(url);
      if (res.status === 404) {
        throw new Error("City not found");
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch consolidated weather data: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setCachedData(storageKey, data);
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, promise);
  return promise;
}

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const data = await fetchConsolidatedDataByCity(city);
  const current = data.current;
  const forecast = data.forecast;

  if (!current || !forecast || !forecast.list) {
    throw new Error("Invalid response format from weather API");
  }

  const weatherCode = current.weather[0].id;
  const { condition, iconName } = getWeatherDetails(weatherCode);

  const locationName = current.name ? `${current.name}, ${current.sys.country}` : city;

  // Tomorrow is 24h later (index 8 in 3-hourly forecast)
  const tomorrowItem = forecast.list.length > 8 ? forecast.list[8] : (forecast.list.length > 0 ? forecast.list[0] : null);
  const tomorrowTemp = tomorrowItem ? Math.round(tomorrowItem.main.temp) : Math.round(current.main.temp - 5);
  const tomorrowCode = tomorrowItem ? tomorrowItem.weather[0].id : 800;
  const { condition: tomorrowCondition, iconName: tomorrowIconName } = getWeatherDetails(tomorrowCode);

  // Compute today's max and min temp from the first 8 items of forecast (next 24 hours)
  let todayMaxTemp = current.main.temp_max;
  let todayMinTemp = current.main.temp_min;
  const first24h = forecast.list.slice(0, 8);
  if (first24h.length > 0) {
    todayMaxTemp = Math.max(...first24h.map((item: any) => item.main.temp_max));
    todayMinTemp = Math.min(...first24h.map((item: any) => item.main.temp_min));
  }

  return {
    temperature: Math.round(current.main.temp),
    humidity: current.main.humidity,
    windSpeed: Math.round(current.wind.speed),
    windDirection: getWindDirection(current.wind.deg),
    weatherCode,
    condition,
    iconName,
    locationName,
    tomorrowTemperature: Math.round(tomorrowTemp),
    tomorrowWeatherCode: tomorrowCode,
    tomorrowCondition,
    tomorrowIconName,
    latitude: current.coord.lat,
    longitude: current.coord.lon,
    todayMaxTemp: Math.round(todayMaxTemp),
    todayMinTemp: Math.round(todayMinTemp),
    pressure: current.main.pressure,
    visibility: current.visibility
  };
}

