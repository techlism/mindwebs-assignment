'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWeatherStore } from '@/lib/store';
import { fetchWeatherData, mockWeatherData } from '@/lib/weather-api';

// Dynamically import map components to avoid SSR issues
const WeatherMap = dynamic(() => import('@/components/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

const Timeline = dynamic(() => import('@/components/Timeline'), {
  ssr: false,
});

const DataSidebar = dynamic(() => import('@/components/DataSidebar'), {
  ssr: false,
});

export default function Home() {
  const { weatherData, setWeatherData, setLoading, isLoading } = useWeatherStore();

  useEffect(() => {
    const loadWeatherData = async () => {
      setLoading(true);
      try {
        // Try to fetch real data, fallback to mock data if API fails
        const data = await fetchWeatherData();
        setWeatherData(data);
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        setWeatherData(mockWeatherData);
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, [setWeatherData, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load weather data</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Weather Dashboard - Berlin
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time weather data with interactive timeline and mapping
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Data Source Sidebar */}
          <div className="lg:col-span-1">
            <DataSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 flex flex-col space-y-6">
            {/* Interactive Map */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border">
              <WeatherMap />
            </div>

            {/* Timeline Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <Timeline />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
