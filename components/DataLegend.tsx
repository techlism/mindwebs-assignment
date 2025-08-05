'use client';

import { useWeatherStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataLegendProps {
  className?: string;
}

export default function DataLegend({ className = '' }: DataLegendProps) {
  const { polygons, parameters } = useWeatherStore();

  const temperatureRanges = [
    { min: -Infinity, max: 0, color: '#1e40af', label: '< 0°C (Freezing)' },
    { min: 0, max: 10, color: '#3b82f6', label: '0-10°C (Cold)' },
    { min: 10, max: 20, color: '#10b981', label: '10-20°C (Mild)' },
    { min: 20, max: 30, color: '#f59e0b', label: '20-30°C (Warm)' },
    { min: 30, max: Infinity, color: '#ef4444', label: '> 30°C (Hot)' },
  ];

  const dataSourceLabels = {
    temperature_2m: 'Temperature (°C)',
    relative_humidity_2m: 'Humidity (%)',
    wind_speed_10m: 'Wind Speed (km/h)',
  };

  const operatorLabels = {
    '<': '<',
    '<=': '≤',
    '>': '>',
    '>=': '≥',
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Temperature Scale Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-600 via-green-500 to-red-500 rounded-full"></div>
            <span>Temperature Scale</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {temperatureRanges.map((range, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: range.color }}
                ></div>
                <span className="text-xs text-gray-700">{range.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Data Sources Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Active Data Sources</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {parameters.filter(param => param.visible).map((param) => (
              <div key={param.key} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: param.color }}
                ></div>
                <span className="text-xs text-gray-700">{param.label}</span>
                <span className="text-xs text-gray-500 ml-auto">{param.unit}</span>
              </div>
            ))}
            {parameters.filter(param => param.visible).length === 0 && (
              <p className="text-xs text-gray-500 italic">No data sources active</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Polygon Thresholds Legend */}
      {polygons.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
              <span>Polygon Thresholds</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {polygons.map((polygon, index) => (
                <div key={polygon.id} className="border-l-4 pl-3 py-2" style={{ borderColor: polygon.color }}>
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: polygon.color }}
                    ></div>
                    <span className="text-xs font-medium text-gray-800">
                      Area {index + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({dataSourceLabels[polygon.dataSource]})
                    </span>
                  </div>
                  
                  {polygon.statistics && (
                    <div className="text-xs text-gray-600 mb-2">
                      Avg: {polygon.statistics.average.toFixed(1)}
                      {polygon.dataSource === 'temperature_2m' ? '°C' : 
                       polygon.dataSource === 'relative_humidity_2m' ? '%' : ' km/h'}
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    {polygon.thresholds.map((threshold, thresholdIndex) => (
                      <div key={thresholdIndex} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: threshold.color }}
                        ></div>
                        <span className="text-xs text-gray-600">
                          {operatorLabels[threshold.operator]} {threshold.value}
                          {polygon.dataSource === 'temperature_2m' ? '°C' : 
                           polygon.dataSource === 'relative_humidity_2m' ? '%' : ' km/h'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Legend Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-gray-600 space-y-1">
            <p>• <strong>Temperature Scale:</strong> Global color mapping for all temperature data</p>
            <p>• <strong>Data Sources:</strong> Currently visible data parameters</p>
            <p>• <strong>Polygon Thresholds:</strong> Custom color rules for drawn areas</p>
            <p>• Colors update in real-time based on timeline selection</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}