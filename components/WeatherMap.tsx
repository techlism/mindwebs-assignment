'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon as LeafletPolygon } from 'react-leaflet';
import { LatLng, divIcon } from 'leaflet';
import { useWeatherStore } from '@/lib/store';
import { Polygon } from '@/types/weather';
import PolygonDrawing from './PolygonDrawing';

// Fix for default markers in React Leaflet
const createCustomIcon = (temperature: number) => {
  const color = getTemperatureColor(temperature);
  return divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">
        ${Math.round(temperature)}°
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const getTemperatureColor = (temp: number): string => {
  if (temp < 0) return '#1e40af';      // Blue for freezing
  if (temp < 10) return '#3b82f6';     // Light blue for cold
  if (temp < 20) return '#10b981';     // Green for mild
  if (temp < 30) return '#f59e0b';     // Orange for warm
  return '#ef4444';                     // Red for hot
};

const getPolygonColor = (polygon: Polygon, currentTemp: number): string => {
  // Use the polygon's threshold rules to determine color
  if (!polygon.thresholds || polygon.thresholds.length === 0) {
    return getTemperatureColor(polygon.temperature || currentTemp) + '40';
  }

  const value = polygon.statistics?.average || polygon.temperature || currentTemp;
  
  // Find the matching threshold
  for (const threshold of polygon.thresholds.sort((a, b) => b.value - a.value)) {
    switch (threshold.operator) {
      case '>=':
        if (value >= threshold.value) return threshold.color + '40';
        break;
      case '>':
        if (value > threshold.value) return threshold.color + '40';
        break;
      case '<=':
        if (value <= threshold.value) return threshold.color + '40';
        break;
      case '<':
        if (value < threshold.value) return threshold.color + '40';
        break;
    }
  }
  
  // Default fallback
  return getTemperatureColor(value) + '40';
};

export default function WeatherMap() {
  const { weatherData, timeline, polygons, currentLocation } = useWeatherStore();
  const [mounted, setMounted] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !weatherData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  const locationPosition: [number, number] = [weatherData.latitude, weatherData.longitude];
  const currentTemperature = weatherData.hourly.temperature_2m[timeline.currentIndex];
  const currentTime = weatherData.hourly.time[timeline.currentIndex];

  return (
    <div className="w-full h-full relative min-h-[400px]">
      <MapContainer
        center={locationPosition}
        zoom={10}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
        scrollWheelZoom={true}
        key={`${currentLocation.latitude}-${currentLocation.longitude}`} // Force re-render on location change
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Current location weather marker */}
        <Marker 
          position={locationPosition}
          icon={createCustomIcon(currentTemperature)}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-semibold mb-2">{currentLocation.name} Weather</h3>
              <p><strong>Temperature:</strong> {currentTemperature?.toFixed(1)}°C</p>
              <p><strong>Time:</strong> {new Date(currentTime).toLocaleString()}</p>
              <p><strong>Humidity:</strong> {weatherData.hourly.relative_humidity_2m[timeline.currentIndex]}%</p>
              <p><strong>Wind:</strong> {weatherData.hourly.wind_speed_10m[timeline.currentIndex]?.toFixed(1)} km/h</p>
            </div>
          </Popup>
        </Marker>

        {/* Render polygons */}
        {polygons.map((polygon) => (
          <LeafletPolygon
            key={polygon.id}
            positions={polygon.coordinates as [number, number][]}
            pathOptions={{
              color: polygon.color,
              fillColor: getPolygonColor(polygon, currentTemperature),
              fillOpacity: 0.4,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-48">
                <h4 className="font-semibold mb-2">Custom Area #{polygons.indexOf(polygon) + 1}</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Data Source:</strong> {polygon.dataSource.replace('_', ' ').replace('2m', ' (2m)')}</p>
                  {polygon.statistics && (
                    <>
                      <p><strong>Average:</strong> {polygon.statistics.average.toFixed(1)}°C</p>
                      <p><strong>Range:</strong> {polygon.statistics.min.toFixed(1)}°C - {polygon.statistics.max.toFixed(1)}°C</p>
                      <p><strong>Points:</strong> {polygon.statistics.count}</p>
                    </>
                  )}
                  <div className="mt-2">
                    <p className="font-medium text-xs">Color Thresholds:</p>
                    {polygon.thresholds.map((threshold, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: threshold.color }}
                        />
                        <span>{threshold.operator} {threshold.value}°C</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>
          </LeafletPolygon>
        ))}

        {/* Polygon drawing tool */}
        <PolygonDrawing />
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Temperature Scale</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1e40af' }}></div>
            <span>{'< 0°C (Freezing)'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>0-10°C (Cold)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
            <span>10-20°C (Mild)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>20-30°C (Warm)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
            <span>{'> 30°C (Hot)'}</span>
          </div>
        </div>
      </div>

      {/* Current weather info overlay */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border z-[1000]">
        <h4 className="font-semibold text-sm mb-1">Current Weather</h4>
        <p className="text-sm">{new Date(currentTime).toLocaleString(undefined, {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p className="text-lg font-bold text-blue-600">{currentTemperature?.toFixed(1)}°C</p>
        <p className="text-xs text-gray-500">{currentLocation.name}</p>
      </div>
    </div>
  );
}