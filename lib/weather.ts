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
}

// Map WMO codes to descriptions and icons
export function getWeatherDetails(code: number): {
  condition: string;
  iconName: "Sun" | "Cloud" | "CloudRain" | "CloudLightning" | "CloudSnow";
} {
  switch (code) {
    case 0:
      return { condition: "Clear Skies", iconName: "Sun" };
    case 1:
    case 2:
    case 3:
      return { condition: "Partly Cloudy", iconName: "Cloud" };
    case 45:
    case 48:
      return { condition: "Foggy", iconName: "Cloud" };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { condition: "Drizzle", iconName: "CloudRain" };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return { condition: "Rainy", iconName: "CloudRain" };
    case 71:
    case 73:
    case 75:
    case 77:
      return { condition: "Snowy", iconName: "CloudSnow" };
    case 80:
    case 81:
    case 82:
      return { condition: "Rain Showers", iconName: "CloudRain" };
    case 85:
    case 86:
      return { condition: "Snow Showers", iconName: "CloudSnow" };
    case 95:
    case 96:
    case 99:
      return { condition: "Thunderstorm", iconName: "CloudLightning" };
    default:
      return { condition: "Unknown", iconName: "Cloud" };
  }
}

// Convert wind direction in degrees to compass direction
export function getWindDirection(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
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
      // Avoid repeating state if it's identical to city
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
    // Return friendly coordinate string on failure
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) {
    throw new Error(`Failed to fetch weather data: ${weatherRes.statusText}`);
  }

  const weatherData = await weatherRes.json();
  const current = weatherData.current;
  const daily = weatherData.daily;

  if (!current || !daily) {
    throw new Error("Invalid response format from weather API");
  }

  const { condition, iconName } = getWeatherDetails(current.weather_code);
  const locationName = await fetchLocationName(lat, lon);

  // Tomorrow's forecast is index 1 (index 0 is today)
  const tomorrowTemp = daily.temperature_2m_max && daily.temperature_2m_max.length > 1 
    ? daily.temperature_2m_max[1] 
    : Math.round(current.temperature_2m - 5); // Fallback
  
  const tomorrowCode = daily.weather_code && daily.weather_code.length > 1
    ? daily.weather_code[1]
    : 0; // Fallback to clear sky

  const { condition: tomorrowCondition, iconName: tomorrowIconName } = getWeatherDetails(tomorrowCode);

  const todayMaxTemp = daily.temperature_2m_max && daily.temperature_2m_max.length > 0
    ? daily.temperature_2m_max[0]
    : current.temperature_2m;

  const todayMinTemp = daily.temperature_2m_min && daily.temperature_2m_min.length > 0
    ? daily.temperature_2m_min[0]
    : current.temperature_2m - 10;

  return {
    temperature: Math.round(current.temperature_2m),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    windDirection: getWindDirection(current.wind_direction_10m),
    weatherCode: current.weather_code,
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
    
    // Extract a shorter name for display: first part (e.g., street or city) and the country
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

