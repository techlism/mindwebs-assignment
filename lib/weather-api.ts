import { WeatherData } from '@/types/weather';

const BERLIN_LAT = 52.54833;
const BERLIN_LON = 13.407822;

// Open Meteo API endpoint for Berlin weather data
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function fetchWeatherData(): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: BERLIN_LAT.toString(),
    longitude: BERLIN_LON.toString(),
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m',
    timezone: 'Europe/Berlin',
    forecast_days: '14', // 2-week forecast as specified
  });

  const url = `${BASE_URL}?${params}`;
  
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

// Mock data for development/testing when API is not available
export const mockWeatherData: WeatherData = {
  latitude: BERLIN_LAT,
  longitude: BERLIN_LON,
  generationtime_ms: 0.123,
  utc_offset_seconds: 3600,
  timezone: "Europe/Berlin",
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
};