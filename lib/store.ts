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
    currentIndex: 0,
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
          // For range mode, use the current position within the range for real-time updates
          // but also provide average data for the range in statistics
          timeIndices = [state.timeline.currentIndex];
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

        // For range mode, also calculate statistics for the entire range
        let rangeStatistics = null;
        if (state.timeline.mode === 'range') {
          const rangeValues: number[] = [];
          for (let i = state.timeline.startIndex; i <= state.timeline.endIndex; i++) {
            if (i >= 0 && i < weatherData.hourly.time.length) {
              const value = weatherData.hourly[polygon.dataSource][i];
              if (typeof value === 'number') {
                rangeValues.push(value);
              }
            }
          }
          
          if (rangeValues.length > 0) {
            const min = Math.min(...rangeValues);
            const max = Math.max(...rangeValues);
            const average = rangeValues.reduce((sum, val) => sum + val, 0) / rangeValues.length;
            
            rangeStatistics = {
              min: Math.round(min * 10) / 10,
              max: Math.round(max * 10) / 10,
              average: Math.round(average * 10) / 10,
              count: rangeValues.length,
            };
          }
        }

        // Use current value for real-time display
        const currentValue = dataValues[0];

        return {
          ...polygon,
          temperature: currentValue, // This will be used for coloring
          statistics: rangeStatistics || {
            min: currentValue,
            max: currentValue,
            average: currentValue,
            count: 1,
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