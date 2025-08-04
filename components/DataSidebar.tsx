'use client';

import { useState } from 'react';
import { useWeatherStore } from '@/lib/store';
import LocationSearch from './LocationSearch';

export default function DataSidebar() {
  const { parameters, toggleParameter, weatherData, timeline, currentLocation, polygons, updatePolygon } = useWeatherStore();
  const [selectedPolygon, setSelectedPolygon] = useState<string | null>(null);
  const [showThresholdEditor, setShowThresholdEditor] = useState(false);

  if (!weatherData) return null;

  const currentTime = weatherData.hourly.time[timeline.currentIndex];
  const currentData = {
    temperature: weatherData.hourly.temperature_2m[timeline.currentIndex],
    humidity: weatherData.hourly.relative_humidity_2m[timeline.currentIndex],
    windSpeed: weatherData.hourly.wind_speed_10m[timeline.currentIndex],
    windDirection: weatherData.hourly.wind_direction_10m[timeline.currentIndex],
  };

  const selectedPolygonData = selectedPolygon 
    ? polygons.find(p => p.id === selectedPolygon)
    : null;

  const dataSourceOptions = [
    { key: 'temperature_2m', label: 'Temperature', unit: '°C' },
    { key: 'relative_humidity_2m', label: 'Humidity', unit: '%' },
    { key: 'wind_speed_10m', label: 'Wind Speed', unit: 'km/h' },
  ] as const;

  const operatorOptions = [
    { key: '>', label: '>' },
    { key: '<', label: '<' },
    { key: '>=', label: '≥' },
    { key: '<=', label: '≤' },
  ] as const;

  const handleDataSourceChange = (polygonId: string, dataSource: any) => {
    updatePolygon(polygonId, { dataSource });
  };

  const handleThresholdUpdate = (polygonId: string, thresholdIndex: number, field: string, value: any) => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;

    const updatedThresholds = [...polygon.thresholds];
    updatedThresholds[thresholdIndex] = {
      ...updatedThresholds[thresholdIndex],
      [field]: value,
    };

    updatePolygon(polygonId, { thresholds: updatedThresholds });
  };

  const addThreshold = (polygonId: string) => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;

    const newThreshold = {
      operator: '>=' as const,
      value: 20,
      color: '#10b981',
    };

    updatePolygon(polygonId, { 
      thresholds: [...polygon.thresholds, newThreshold] 
    });
  };

  const removeThreshold = (polygonId: string, thresholdIndex: number) => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;

    const updatedThresholds = polygon.thresholds.filter((_, idx) => idx !== thresholdIndex);
    updatePolygon(polygonId, { thresholds: updatedThresholds });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Weather Data</h2>
        <p className="text-sm text-gray-600">{currentLocation.name}, {currentLocation.country}</p>
      </div>

      {/* Location Search */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Location</h3>
        <LocationSearch />
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

      {/* Polygon Data Sources */}
      {polygons.length > 0 && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Polygon Configuration</h3>
            <div className="text-xs text-gray-500">
              {timeline.mode === 'range' 
                ? `${timeline.endIndex - timeline.startIndex + 1}h avg` 
                : 'Current hour'
              }
            </div>
          </div>
          <div className="space-y-3">
            {polygons.map((polygon, index) => (
              <div key={polygon.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: polygon.color }}
                    />
                    <span className="text-sm font-medium">Area {index + 1}</span>
                    {polygon.statistics && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {polygon.statistics.average.toFixed(1)}°C
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPolygon(
                      selectedPolygon === polygon.id ? null : polygon.id
                    )}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {selectedPolygon === polygon.id ? 'Hide' : 'Configure'}
                  </button>
                </div>

                {selectedPolygon === polygon.id && (
                  <div className="space-y-3 mt-3 pt-3 border-t">
                    {/* Data Source Selection */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Data Source
                      </label>
                      <select
                        value={polygon.dataSource}
                        onChange={(e) => handleDataSourceChange(polygon.id, e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        {dataSourceOptions.map(option => (
                          <option key={option.key} value={option.key}>
                            {option.label} ({option.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Real-time Statistics Display */}
                    {polygon.statistics && (
                      <div className="bg-blue-50 p-2 rounded text-xs">
                        <div className="font-medium text-blue-800 mb-1">Live Statistics:</div>
                        <div className="space-y-1 text-blue-700">
                          <div className="flex justify-between">
                            <span>Average:</span>
                            <span className="font-medium">{polygon.statistics.average.toFixed(1)}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Range:</span>
                            <span>{polygon.statistics.min.toFixed(1)} - {polygon.statistics.max.toFixed(1)}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Data points:</span>
                            <span>{polygon.statistics.count}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Color Thresholds */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600">
                          Color Thresholds
                        </label>
                        <button
                          onClick={() => addThreshold(polygon.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {polygon.thresholds.map((threshold, thresholdIndex) => (
                          <div key={thresholdIndex} className="flex items-center space-x-2">
                            <select
                              value={threshold.operator}
                              onChange={(e) => handleThresholdUpdate(polygon.id, thresholdIndex, 'operator', e.target.value)}
                              className="text-xs border border-gray-300 rounded px-1 py-1 w-12"
                            >
                              {operatorOptions.map(op => (
                                <option key={op.key} value={op.key}>{op.label}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={threshold.value}
                              onChange={(e) => handleThresholdUpdate(polygon.id, thresholdIndex, 'value', parseFloat(e.target.value))}
                              className="text-xs border border-gray-300 rounded px-2 py-1 w-16"
                            />
                            <input
                              type="color"
                              value={threshold.color}
                              onChange={(e) => handleThresholdUpdate(polygon.id, thresholdIndex, 'color', e.target.value)}
                              className="w-6 h-6 rounded border"
                            />
                            <button
                              onClick={() => removeThreshold(polygon.id, thresholdIndex)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
        <h3 className="text-sm font-medium text-gray-700 mb-2">Location Details</h3>
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