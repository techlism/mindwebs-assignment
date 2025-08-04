'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeatherChartProps {
  data: Array<{
    time: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    isSelected?: boolean;
    isCurrent?: boolean;
  }>;
  type: 'timeline' | 'trend' | 'comparison';
  title: string;
  selectedRange?: { start: number; end: number };
  currentIndex?: number;
  onDataPointClick?: (index: number) => void;
}

const COLORS = {
  temperature: '#ef4444',
  humidity: '#3b82f6',
  windSpeed: '#10b981',
  windDirection: '#f59e0b',
  selected: '#8b5cf6',
  current: '#ec4899',
};

export function WeatherChart({
  data,
  type,
  title,
  selectedRange,
  currentIndex,
  onDataPointClick,
}: WeatherChartProps) {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    });
  };

  const formatTimeShort = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{formatTime(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toFixed(1)} {getUnit(entry.name)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getUnit = (name: string) => {
    switch (name) {
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      case 'windSpeed':
        return 'km/h';
      case 'windDirection':
        return '°';
      default:
        return '';
    }
  };

  const renderTimelineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="time"
          tickFormatter={formatTimeShort}
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis yAxisId="temperature" orientation="left" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="humidity" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Temperature bars with selection highlighting */}
        <Bar
          yAxisId="temperature"
          dataKey="temperature"
          fill={COLORS.temperature}
          opacity={0.7}
          onClick={(data, index) => onDataPointClick?.(index)}
          className="cursor-pointer"
        />
        
        {/* Humidity line */}
        <Line
          yAxisId="humidity"
          type="monotone"
          dataKey="humidity"
          stroke={COLORS.humidity}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderTrendChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="time"
          tickFormatter={formatTimeShort}
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="temperature"
          stroke={COLORS.temperature}
          fill={COLORS.temperature}
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderComparisonChart = () => {
    // Calculate statistics for pie chart
    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
    const avgHumidity = data.reduce((sum, d) => sum + d.humidity, 0) / data.length;
    const avgWindSpeed = data.reduce((sum, d) => sum + d.windSpeed, 0) / data.length;

    const pieData = [
      { name: 'Temperature', value: avgTemp, color: COLORS.temperature },
      { name: 'Humidity', value: avgHumidity, color: COLORS.humidity },
      { name: 'Wind Speed', value: avgWindSpeed, color: COLORS.windSpeed },
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value?.toFixed(1) || '0'}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'timeline':
        return renderTimelineChart();
      case 'trend':
        return renderTrendChart();
      case 'comparison':
        return renderComparisonChart();
      default:
        return renderTimelineChart();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}

// Individual metric charts for polygon statistics
interface MetricChartProps {
  title: string;
  value: number;
  unit: string;
  trend?: number[];
  color: string;
}

export function MetricChart({ title, value, unit, trend, color }: MetricChartProps) {
  const trendData = trend?.map((val, idx) => ({
    index: idx,
    value: val,
  })) || [];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">{title}</h4>
          <div className="text-lg font-bold" style={{ color }}>
            {value.toFixed(1)} {unit}
          </div>
        </div>
        {trend && trend.length > 0 && (
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={trendData}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}