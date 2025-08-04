'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PolygonAnalyticsProps {
  polygon: any;
  weatherData: any;
  timeline: any;
}

export function PolygonAnalytics({ polygon, weatherData, timeline }: PolygonAnalyticsProps) {
  // Generate comprehensive data for the polygon
  const generatePolygonData = () => {
    if (!weatherData || !polygon.dataSource) return [];

    const data = [];
    const hourlyData = weatherData.hourly as any;
    const sourceData = hourlyData[polygon.dataSource];
    
    for (let i = 0; i < weatherData.hourly.time.length; i++) {
      const time = new Date(weatherData.hourly.time[i]);
      data.push({
        time: weatherData.hourly.time[i],
        hour: time.getHours(),
        day: time.getDate(),
        value: sourceData[i],
        temperature: weatherData.hourly.temperature_2m[i],
        humidity: weatherData.hourly.relative_humidity_2m[i],
        windSpeed: weatherData.hourly.wind_speed_10m[i],
        isInRange: timeline.mode === 'range' && i >= timeline.startIndex && i <= timeline.endIndex,
        isCurrent: timeline.mode === 'single' && i === timeline.currentIndex,
      });
    }

    return data;
  };

  // Calculate trend analysis
  const calculateTrend = (data: any[]) => {
    if (data.length < 2) return { direction: 'stable', change: 0 };
    
    const start = data[0].value;
    const end = data[data.length - 1].value;
    const change = ((end - start) / start) * 100;
    
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(change) > 5) {
      direction = change > 0 ? 'up' : 'down';
    }
    
    return { direction, change };
  };

  // Get statistics for current selection
  const getSelectionStats = (data: any[]) => {
    const selectedData = timeline.mode === 'range' 
      ? data.filter(d => d.isInRange)
      : data.filter(d => d.isCurrent);
    
    if (selectedData.length === 0) return null;
    
    const values = selectedData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      min: min.toFixed(1),
      max: max.toFixed(1),
      avg: avg.toFixed(1),
      stdDev: stdDev.toFixed(1),
      count: selectedData.length,
      range: (max - min).toFixed(1),
    };
  };

  const polygonData = generatePolygonData();
  const selectedData = timeline.mode === 'range' 
    ? polygonData.filter(d => d.isInRange)
    : polygonData;
  const trend = calculateTrend(selectedData);
  const stats = getSelectionStats(polygonData);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{formatTime(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toFixed(1)} {getUnit(polygon.dataSource)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getUnit = (dataSource: string) => {
    switch (dataSource) {
      case 'temperature_2m':
        return '°C';
      case 'relative_humidity_2m':
        return '%';
      case 'wind_speed_10m':
        return 'km/h';
      default:
        return '';
    }
  };

  const TrendIcon = ({ direction }: { direction: string }) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  // Hourly distribution data
  const getHourlyDistribution = () => {
    const hourlyStats: { [key: number]: number[] } = {};
    
    polygonData.forEach(d => {
      if (!hourlyStats[d.hour]) hourlyStats[d.hour] = [];
      hourlyStats[d.hour].push(d.value);
    });

    return Object.entries(hourlyStats).map(([hour, values]) => ({
      hour: parseInt(hour),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }));
  };

  const hourlyData = getHourlyDistribution();

  return (
    <div className="space-y-4">
      {/* Trend Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Trend Analysis</CardTitle>
            <div className="flex items-center space-x-2">
              <TrendIcon direction={trend.direction} />
              <span className={`text-sm font-medium ${
                trend.direction === 'up' ? 'text-green-600' : 
                trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={selectedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatTime}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={polygon.color}
                fill={polygon.color}
                fillOpacity={0.3}
              />
              {timeline.mode === 'single' && (
                <ReferenceLine 
                  x={polygonData[timeline.currentIndex]?.time} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Statistical Summary */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Statistical Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Average</div>
                <div className="font-semibold">{stats.avg} {getUnit(polygon.dataSource)}</div>
              </div>
              <div>
                <div className="text-gray-600">Range</div>
                <div className="font-semibold">{stats.range} {getUnit(polygon.dataSource)}</div>
              </div>
              <div>
                <div className="text-gray-600">Minimum</div>
                <div className="font-semibold">{stats.min} {getUnit(polygon.dataSource)}</div>
              </div>
              <div>
                <div className="text-gray-600">Maximum</div>
                <div className="font-semibold">{stats.max} {getUnit(polygon.dataSource)}</div>
              </div>
              <div>
                <div className="text-gray-600">Std. Deviation</div>
                <div className="font-semibold">{stats.stdDev} {getUnit(polygon.dataSource)}</div>
              </div>
              <div>
                <div className="text-gray-600">Data Points</div>
                <div className="font-semibold">{stats.count}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hourly Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Daily Pattern Analysis</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 10 }}
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value?.toFixed(1)} ${getUnit(polygon.dataSource)}`,
                  name === 'avg' ? 'Average' : name === 'min' ? 'Minimum' : 'Maximum'
                ]}
                labelFormatter={(hour) => `Hour: ${hour}:00`}
              />
              <Bar dataKey="avg" fill={polygon.color} opacity={0.8} />
              <Bar dataKey="min" fill={polygon.color} opacity={0.4} />
              <Bar dataKey="max" fill={polygon.color} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Correlation Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Multi-Parameter Analysis</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={selectedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatTime}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={polygon.color} 
                strokeWidth={2}
                name={`${polygon.dataSource.replace('_', ' ').replace('2m', '').replace('10m', '')}`}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#ef4444" 
                strokeWidth={1}
                strokeDasharray="3 3"
                name="Temperature"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="humidity" 
                stroke="#3b82f6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                name="Humidity"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}