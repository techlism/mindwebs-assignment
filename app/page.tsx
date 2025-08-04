"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useWeatherStore } from "@/lib/store";
import { createMockWeatherData, fetchWeatherData } from "@/lib/weather-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Dynamically import map components to avoid SSR issues
const WeatherMap = dynamic(() => import("@/components/WeatherMap"), {
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

const Timeline = dynamic(() => import("@/components/Timeline"), {
  ssr: false,
});

const DataSidebar = dynamic(() => import("@/components/DataSidebar"), {
  ssr: false,
});

export default function Home() {
  const {
    weatherData,
    setWeatherData,
    setLoading,
    isLoading,
    currentLocation,
  } = useWeatherStore();

  useEffect(() => {
    const loadWeatherData = async () => {
      setLoading(true);
      try {
        // Try to fetch real data, fallback to mock data if API fails
        const data = await fetchWeatherData(currentLocation);
        setWeatherData(data);
      } catch (error) {
        console.warn("Using mock data due to API error:", error);
        setWeatherData(createMockWeatherData(currentLocation));
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, [currentLocation, setWeatherData, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card>
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading weather data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card>
          <CardContent className="text-center p-8">
            <p className="text-red-600 mb-4">Failed to load weather data</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Weather Dashboard - {currentLocation.name}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Interactive weather data with advanced timeline and mapping visualization
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
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Interactive Weather Map</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <WeatherMap />
              </CardContent>
            </Card>

            {/* Timeline Controls */}
            <Timeline />
          </div>
        </div>
      </div>
    </div>
  );
}
