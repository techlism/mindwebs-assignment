// Open Meteo API types based on weather data structure
export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
    relative_humidity_2m: string;
    wind_speed_10m: string;
    wind_direction_10m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
}

export interface Location {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  admin1?: string;
}

export interface GeocodingResult {
  results: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    feature_code: string;
    country_code: string;
    admin1_id: number;
    admin2_id: number;
    admin3_id: number;
    admin4_id: number;
    timezone: string;
    population: number;
    country_id: number;
    country: string;
    admin1: string;
    admin2: string;
    admin3: string;
    admin4: string;
  }>;
  generationtime_ms: number;
}

// Timeline slider state
export interface TimelineState {
  currentIndex: number;
  startIndex: number;
  endIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  mode: 'single' | 'range';
}

// Polygon drawing state
export interface Polygon {
  id: string;
  coordinates: [number, number][];
  color: string;
  temperature?: number;
}

// Weather parameters for sidebar
export interface WeatherParameter {
  key: keyof WeatherData['hourly'];
  label: string;
  unit: string;
  visible: boolean;
  color: string;
}