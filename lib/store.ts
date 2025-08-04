import { create } from 'zustand';
import { WeatherData, TimelineState, Polygon, WeatherParameter, Location } from '@/types/weather';

interface WeatherStore {
  // Weather data
  weatherData: WeatherData | null;
  setWeatherData: (data: WeatherData) => void;
  
  // Current location
  currentLocation: Location;
  setCurrentLocation: (location: Location) => void;
  
  // Timeline controls
  timeline: TimelineState;
  setCurrentIndex: (index: number) => void;
  setTimelineRange: (startIndex: number, endIndex: number) => void;
  setTimelineMode: (mode: 'single' | 'range') => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  
  // Polygons
  polygons: Polygon[];
  addPolygon: (polygon: Polygon) => void;
  removePolygon: (id: string) => void;
  updatePolygon: (id: string, updates: Partial<Polygon>) => void;
  updatePolygonDataForTimeline: () => void;
  
  // Weather parameters visibility
  parameters: WeatherParameter[];
  toggleParameter: (key: string) => void;
  
  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  // Initial state
  weatherData: null,
  currentLocation: {
    latitude: 40.7128,
    longitude: -74.0060,
    name: 'New York',
    country: 'United States'
  },
  timeline: {
    currentIndex: 336, // Start at current time (middle of 30-day window: 14 days * 24 hours)
    startIndex: 0,
    endIndex: 23, // Default to 24 hours
    isPlaying: false,
    playbackSpeed: 1000, // milliseconds
    mode: 'single',
  },
  polygons: [],
  parameters: [
    {
      key: 'temperature_2m',
      label: 'Temperature',
      unit: '°C',
      visible: true,
      color: '#ff6b6b',
    },
    {
      key: 'relative_humidity_2m',
      label: 'Humidity',
      unit: '%',
      visible: false,
      color: '#4ecdc4',
    },
    {
      key: 'wind_speed_10m',
      label: 'Wind Speed',
      unit: 'km/h',
      visible: false,
      color: '#45b7d1',
    },
    {
      key: 'wind_direction_10m',
      label: 'Wind Direction',
      unit: '°',
      visible: false,
      color: '#96ceb4',
    },
  ],
  isLoading: false,

  // Actions
  setWeatherData: (data) => set({ weatherData: data }),
  
  setCurrentLocation: (location) => set({ currentLocation: location }),
  
  setCurrentIndex: (index) => 
    set((state) => ({
      timeline: { ...state.timeline, currentIndex: index }
    })),

  setTimelineRange: (startIndex, endIndex) =>
    set((state) => ({
      timeline: { ...state.timeline, startIndex, endIndex }
    })),

  setTimelineMode: (mode) =>
    set((state) => ({
      timeline: { ...state.timeline, mode }
    })),
    
  togglePlayback: () =>
    set((state) => ({
      timeline: { ...state.timeline, isPlaying: !state.timeline.isPlaying }
    })),
    
  setPlaybackSpeed: (speed) =>
    set((state) => ({
      timeline: { ...state.timeline, playbackSpeed: speed }
    })),
    
  addPolygon: (polygon) =>
    set((state) => ({
      polygons: [...state.polygons, polygon]
    })),
    
  removePolygon: (id) =>
    set((state) => ({
      polygons: state.polygons.filter(p => p.id !== id)
    })),
    
  updatePolygon: (id, updates) =>
    set((state) => ({
      polygons: state.polygons.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    })),

  updatePolygonDataForTimeline: () =>
    set((state) => {
      if (!state.weatherData) return state;

      const weatherData = state.weatherData; // Store in variable for type safety
      const updatedPolygons = state.polygons.map(polygon => {
        // Calculate data for current timeline selection
        let dataValues: number[] = [];
        let timeIndices: number[] = [];

        if (state.timeline.mode === 'single') {
          timeIndices = [state.timeline.currentIndex];
        } else {
          timeIndices = Array.from(
            { length: state.timeline.endIndex - state.timeline.startIndex + 1 },
            (_, i) => state.timeline.startIndex + i
          );
        }

        // Get data values based on polygon's data source
        for (const index of timeIndices) {
          if (index >= 0 && index < weatherData.hourly.time.length) {
            const value = weatherData.hourly[polygon.dataSource][index];
            if (typeof value === 'number') {
              dataValues.push(value);
            }
          }
        }

        if (dataValues.length === 0) return polygon;

        // Calculate statistics for the time period
        const min = Math.min(...dataValues);
        const max = Math.max(...dataValues);
        const average = dataValues.reduce((sum, val) => sum + val, 0) / dataValues.length;

        return {
          ...polygon,
          temperature: average, // This will be used for coloring
          statistics: {
            min: Math.round(min * 10) / 10,
            max: Math.round(max * 10) / 10,
            average: Math.round(average * 10) / 10,
            count: dataValues.length,
          },
        };
      });

      return { polygons: updatedPolygons };
    }),
    
  toggleParameter: (key) =>
    set((state) => ({
      parameters: state.parameters.map(p =>
        p.key === key ? { ...p, visible: !p.visible } : p
      )
    })),
    
  setLoading: (loading) => set({ isLoading: loading }),
}));