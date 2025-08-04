import { WeatherData, Location, GeocodingResult } from '@/types/weather';

// Default location (Berlin)
const DEFAULT_LOCATION: Location = {
  latitude: 52.54833,
  longitude: 13.407822,
  name: 'Berlin',
  country: 'Germany'
};

// Open Meteo API endpoints
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function fetchWeatherData(location: Location = DEFAULT_LOCATION): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m',
    timezone: 'auto',
    forecast_days: '14', // 2-week forecast as specified
  });

  const url = `${WEATHER_BASE_URL}?${params}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }
    
    const data: WeatherData = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    throw error;
  }
}

export async function searchLocations(query: string): Promise<Location[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    name: query.trim(),
    count: '10',
    language: 'en',
    format: 'json'
  });

  const url = `${GEOCODING_BASE_URL}?${params}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
    }
    
    const data: GeocodingResult = await response.json();
    
    return data.results?.map(result => ({
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name,
      country: result.country,
      admin1: result.admin1,
    })) || [];
  } catch (error) {
    console.error('Failed to search locations:', error);
    return [];
  }
}

// Mock data for development/testing when API is not available
export const createMockWeatherData = (location: Location = DEFAULT_LOCATION): WeatherData => ({
  latitude: location.latitude,
  longitude: location.longitude,
  generationtime_ms: 0.123,
  utc_offset_seconds: 3600,
  timezone: "auto",
  timezone_abbreviation: "CET",
  elevation: 74.0,
  hourly_units: {
    time: "iso8601",
    temperature_2m: "°C",
    relative_humidity_2m: "%",
    wind_speed_10m: "km/h",
    wind_direction_10m: "°"
  },
  hourly: {
    time: Array.from({ length: 336 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() + i);
      return date.toISOString();
    }),
    temperature_2m: Array.from({ length: 336 }, (_, i) => 
      Math.round((Math.sin(i / 24 * Math.PI * 2) * 10 + 15 + Math.random() * 5) * 10) / 10
    ),
    relative_humidity_2m: Array.from({ length: 336 }, () => 
      Math.round((Math.random() * 40 + 40))
    ),
    wind_speed_10m: Array.from({ length: 336 }, () => 
      Math.round(Math.random() * 25 * 10) / 10
    ),
    wind_direction_10m: Array.from({ length: 336 }, () => 
      Math.round(Math.random() * 360)
    ),
  }
});

export const mockWeatherData = createMockWeatherData();