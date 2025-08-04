import { create } from 'zustand';
import { WeatherData, TimelineState, Polygon, WeatherParameter } from '@/types/weather';

interface WeatherStore {
  // Weather data
  weatherData: WeatherData | null;
  setWeatherData: (data: WeatherData) => void;
  
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
    
  toggleParameter: (key) =>
    set((state) => ({
      parameters: state.parameters.map(p =>
        p.key === key ? { ...p, visible: !p.visible } : p
      )
    })),
    
  setLoading: (loading) => set({ isLoading: loading }),
}));