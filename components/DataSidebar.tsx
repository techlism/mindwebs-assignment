"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricChart } from "@/components/ui/weather-chart";
import { useWeatherStore } from "@/lib/store";
import LocationSearch from "./LocationSearch";

export default function DataSidebar() {
  const {
    parameters,
    toggleParameter,
    weatherData,
    timeline,
    currentLocation,
    polygons,
    updatePolygon,
  } = useWeatherStore();
  const [selectedPolygon, setSelectedPolygon] = useState<string | null>(null);

  if (!weatherData) return null;

  const currentTime = weatherData.hourly.time[timeline.currentIndex];
  const currentData = {
    temperature: weatherData.hourly.temperature_2m[timeline.currentIndex],
    humidity: weatherData.hourly.relative_humidity_2m[timeline.currentIndex],
    windSpeed: weatherData.hourly.wind_speed_10m[timeline.currentIndex],
    windDirection: weatherData.hourly.wind_direction_10m[timeline.currentIndex],
  };

  const selectedPolygonData = selectedPolygon
    ? polygons.find((p) => p.id === selectedPolygon)
    : null;

  const dataSourceOptions = [
    { key: "temperature_2m", label: "Temperature", unit: "°C" },
    { key: "relative_humidity_2m", label: "Humidity", unit: "%" },
    { key: "wind_speed_10m", label: "Wind Speed", unit: "km/h" },
  ] as const;

  const operatorOptions = [
    { key: ">", label: ">" },
    { key: "<", label: "<" },
    { key: ">=", label: "≥" },
    { key: "<=", label: "≤" },
  ] as const;

  const handleDataSourceChange = (polygonId: string, dataSource: any) => {
    updatePolygon(polygonId, { dataSource });
  };

  const handleThresholdUpdate = (
    polygonId: string,
    thresholdIndex: number,
    field: string,
    value: any,
  ) => {
    const polygon = polygons.find((p) => p.id === polygonId);
    if (!polygon) return;

    const updatedThresholds = [...polygon.thresholds];
    updatedThresholds[thresholdIndex] = {
      ...updatedThresholds[thresholdIndex],
      [field]: value,
    };

    updatePolygon(polygonId, { thresholds: updatedThresholds });
  };

  const addThreshold = (polygonId: string) => {
    const polygon = polygons.find((p) => p.id === polygonId);
    if (!polygon) return;

    const newThreshold = {
      operator: ">=" as const,
      value: 20,
      color: "#10b981",
    };

    updatePolygon(polygonId, {
      thresholds: [...polygon.thresholds, newThreshold],
    });
  };

  const removeThreshold = (polygonId: string, thresholdIndex: number) => {
    const polygon = polygons.find((p) => p.id === polygonId);
    if (!polygon) return;

    const updatedThresholds = polygon.thresholds.filter(
      (_, idx) => idx !== thresholdIndex,
    );
    updatePolygon(polygonId, { thresholds: updatedThresholds });
  };

  // Get trend data for polygon statistics
  const getPolygonTrendData = (polygon: any) => {
    if (!polygon.dataSource || !weatherData) return [];

    const step = Math.max(1, Math.floor(weatherData.hourly.time.length / 24)); // Get 24 data points
    const trend = [];

    for (let i = 0; i < weatherData.hourly.time.length; i += step) {
      const hourlyData = weatherData.hourly as any;
      const value = hourlyData[polygon.dataSource][i];
      if (typeof value === "number") {
        trend.push(value);
      }
    }

    return trend;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Weather Data</CardTitle>
          <p className="text-sm text-gray-600">
            {currentLocation.name}, {currentLocation.country}
          </p>
        </CardHeader>
      </Card>

      {/* Location Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Location</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <LocationSearch />
        </CardContent>
      </Card>

      {/* Current Values */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current Values</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {currentTime && (
            <div className="grid grid-cols-1 gap-3">
              <MetricChart
                title="Temperature"
                value={currentData.temperature || 0}
                unit="°C"
                color="#ef4444"
                trend={weatherData.hourly.temperature_2m.slice(
                  Math.max(0, timeline.currentIndex - 12),
                  timeline.currentIndex + 12,
                )}
              />
              <MetricChart
                title="Humidity"
                value={currentData.humidity || 0}
                unit="%"
                color="#3b82f6"
                trend={weatherData.hourly.relative_humidity_2m.slice(
                  Math.max(0, timeline.currentIndex - 12),
                  timeline.currentIndex + 12,
                )}
              />
              <MetricChart
                title="Wind Speed"
                value={currentData.windSpeed || 0}
                unit="km/h"
                color="#10b981"
                trend={weatherData.hourly.wind_speed_10m.slice(
                  Math.max(0, timeline.currentIndex - 12),
                  timeline.currentIndex + 12,
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Polygon Data Sources */}
      {polygons.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Polygon Analytics</CardTitle>
              <div className="text-xs text-gray-500">
                {timeline.mode === "range"
                  ? `${timeline.endIndex - timeline.startIndex + 1}h avg`
                  : "Current hour"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {polygons.map((polygon, index) => (
              <div key={polygon.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: polygon.color }}
                    />
                    <span className="text-sm font-medium">
                      Area {index + 1}
                    </span>
                    {polygon.statistics && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {polygon.statistics.average.toFixed(1)}°C
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedPolygon(
                        selectedPolygon === polygon.id ? null : polygon.id,
                      )
                    }
                  >
                    {selectedPolygon === polygon.id ? "Hide" : "Configure"}
                  </Button>
                </div>

                {/* Polygon Statistics Charts */}
                {polygon.statistics && (
                  <div className="grid grid-cols-1 gap-2">
                    <MetricChart
                      title={`${dataSourceOptions.find((opt) => opt.key === polygon.dataSource)?.label || "Value"}`}
                      value={polygon.statistics.average}
                      unit={
                        dataSourceOptions.find(
                          (opt) => opt.key === polygon.dataSource,
                        )?.unit || ""
                      }
                      color={polygon.color}
                      trend={getPolygonTrendData(polygon)}
                    />
                  </div>
                )}

                {selectedPolygon === polygon.id && (
                  <div className="space-y-3 pt-3 border-t">
                    {/* Data Source Selection */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Data Source
                      </label>
                      <select
                        value={polygon.dataSource}
                        onChange={(e) =>
                          handleDataSourceChange(polygon.id, e.target.value)
                        }
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        {dataSourceOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label} ({option.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Real-time Statistics Display */}
                    {polygon.statistics && (
                      <div className="bg-blue-50 p-3 rounded text-xs space-y-2">
                        <div className="font-medium text-blue-800">
                          Live Statistics:
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-blue-700">
                          <div>
                            <div className="text-gray-600">Average</div>
                            <div className="font-medium">
                              {polygon.statistics.average.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Range</div>
                            <div className="font-medium">
                              {polygon.statistics.min.toFixed(1)} -{" "}
                              {polygon.statistics.max.toFixed(1)}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-gray-600">Data points: </span>
                          <span className="font-medium">
                            {polygon.statistics.count}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Color Thresholds */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600">
                          Color Thresholds
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addThreshold(polygon.id)}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {polygon.thresholds.map((threshold, thresholdIndex) => (
                          <div
                            key={thresholdIndex}
                            className="flex items-center space-x-2"
                          >
                            <select
                              value={threshold.operator}
                              onChange={(e) =>
                                handleThresholdUpdate(
                                  polygon.id,
                                  thresholdIndex,
                                  "operator",
                                  e.target.value,
                                )
                              }
                              className="text-xs border border-gray-300 rounded px-1 py-1 w-12"
                            >
                              {operatorOptions.map((op) => (
                                <option key={op.key} value={op.key}>
                                  {op.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={threshold.value}
                              onChange={(e) =>
                                handleThresholdUpdate(
                                  polygon.id,
                                  thresholdIndex,
                                  "value",
                                  parseFloat(e.target.value),
                                )
                              }
                              className="text-xs border border-gray-300 rounded px-2 py-1 w-16"
                            />
                            <input
                              type="color"
                              value={threshold.color}
                              onChange={(e) =>
                                handleThresholdUpdate(
                                  polygon.id,
                                  thresholdIndex,
                                  "color",
                                  e.target.value,
                                )
                              }
                              className="w-6 h-6 rounded border"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeThreshold(polygon.id, thresholdIndex)
                              }
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Parameter Controls */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Display Parameters</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {parameters.map((param) => (
              <label
                key={param.key}
                className="flex items-center space-x-3 cursor-pointer"
              >
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
                  <span className="text-xs text-gray-500 ml-auto">
                    {param.unit}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Location Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-gray-600 space-y-1">
            <div>Lat: {weatherData.latitude.toFixed(5)}</div>
            <div>Lon: {weatherData.longitude.toFixed(5)}</div>
            <div>Elevation: {weatherData.elevation}m</div>
            <div>Timezone: {weatherData.timezone}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
