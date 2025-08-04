'use client';

import { useWeatherStore } from '@/lib/store';

export default function DataSidebar() {
  const { parameters, toggleParameter, weatherData, timeline } = useWeatherStore();

  if (!weatherData) return null;

  const currentTime = weatherData.hourly.time[timeline.currentIndex];
  const currentData = {
    temperature: weatherData.hourly.temperature_2m[timeline.currentIndex],
    humidity: weatherData.hourly.relative_humidity_2m[timeline.currentIndex],
    windSpeed: weatherData.hourly.wind_speed_10m[timeline.currentIndex],
    windDirection: weatherData.hourly.wind_direction_10m[timeline.currentIndex],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Weather Data</h2>
        <p className="text-sm text-gray-600">Berlin, Germany</p>
      </div>

      {/* Current Values */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Current Values</h3>
        {currentTime && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium">
                {new Date(currentTime).toLocaleString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Temperature:</span>
              <span className="font-medium">{currentData.temperature?.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Humidity:</span>
              <span className="font-medium">{currentData.humidity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Wind Speed:</span>
              <span className="font-medium">{currentData.windSpeed?.toFixed(1)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Wind Direction:</span>
              <span className="font-medium">{currentData.windDirection}°</span>
            </div>
          </div>
        )}
      </div>

      {/* Parameter Controls */}
      <div className="flex-1 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Display Parameters</h3>
        <div className="space-y-2">
          {parameters.map((param) => (
            <label key={param.key} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={param.visible}
                onChange={() => toggleParameter(param.key)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2 flex-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: param.color }}
                />
                <span className="text-sm text-gray-700">{param.label}</span>
                <span className="text-xs text-gray-500 ml-auto">{param.unit}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Location Info */}
      <div className="p-4 border-t bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Lat: {weatherData.latitude.toFixed(5)}</div>
          <div>Lon: {weatherData.longitude.toFixed(5)}</div>
          <div>Elevation: {weatherData.elevation}m</div>
          <div>Timezone: {weatherData.timezone}</div>
        </div>
      </div>
    </div>
  );
}