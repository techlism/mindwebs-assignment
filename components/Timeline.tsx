'use client';

import { useEffect, useRef, useState } from 'react';
import { useWeatherStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherChart } from '@/components/ui/weather-chart';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Timeline() {
  const {
    weatherData,
    timeline,
    setCurrentIndex,
    setTimelineRange,
    setTimelineMode,
    togglePlayback,
    setPlaybackSpeed,
    updatePolygonDataForTimeline,
    polygons,
  } = useWeatherStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Update polygon data when timeline changes
  useEffect(() => {
    updatePolygonDataForTimeline();
  }, [timeline.currentIndex, timeline.startIndex, timeline.endIndex, timeline.mode, updatePolygonDataForTimeline]);

  // Auto-advance timeline when playing
  useEffect(() => {
    if (timeline.isPlaying && weatherData) {
      intervalRef.current = setInterval(() => {
        if (timeline.mode === 'single') {
          setCurrentIndex((timeline.currentIndex + 1) % weatherData.hourly.time.length);
        } else {
          // For range mode, advance the window
          const windowSize = timeline.endIndex - timeline.startIndex;
          const newStart = (timeline.startIndex + 1) % (weatherData.hourly.time.length - windowSize);
          setTimelineRange(newStart, newStart + windowSize);
        }
      }, timeline.playbackSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeline.isPlaying, timeline.currentIndex, timeline.startIndex, timeline.endIndex, timeline.mode, timeline.playbackSpeed, weatherData, setCurrentIndex, setTimelineRange]);

  if (!weatherData) return null;

  const totalHours = weatherData.hourly.time.length;
  const currentTime = weatherData.hourly.time[timeline.currentIndex];
  const startTime = weatherData.hourly.time[timeline.startIndex];
  const endTime = weatherData.hourly.time[timeline.endIndex];
  
  const singleProgress = (timeline.currentIndex / totalHours) * 100;
  const rangeStartProgress = (timeline.startIndex / totalHours) * 100;
  const rangeEndProgress = (timeline.endIndex / totalHours) * 100;

  const handleSingleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value);
    setCurrentIndex(newIndex);
  };

  const handleRangeStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseInt(e.target.value);
    if (newStart < timeline.endIndex) {
      setTimelineRange(newStart, timeline.endIndex);
    }
  };

  const handleRangeEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseInt(e.target.value);
    if (newEnd > timeline.startIndex) {
      setTimelineRange(timeline.startIndex, newEnd);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const handleModeChange = (mode: 'single' | 'range') => {
    setTimelineMode(mode);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('de-DE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeShort = (timeString: string) => {
    return new Date(timeString).toLocaleString('de-DE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    });
  };

  const jumpToTime = (direction: 'start' | 'end' | 'prev-day' | 'next-day') => {
    if (timeline.mode === 'single') {
      let newIndex = timeline.currentIndex;
      
      switch (direction) {
        case 'start':
          newIndex = 0;
          break;
        case 'end':
          newIndex = totalHours - 1;
          break;
        case 'prev-day':
          newIndex = Math.max(0, timeline.currentIndex - 24);
          break;
        case 'next-day':
          newIndex = Math.min(totalHours - 1, timeline.currentIndex + 24);
          break;
      }
      
      setCurrentIndex(newIndex);
    } else {
      const windowSize = timeline.endIndex - timeline.startIndex;
      let newStart = timeline.startIndex;
      
      switch (direction) {
        case 'start':
          newStart = 0;
          break;
        case 'end':
          newStart = totalHours - windowSize - 1;
          break;
        case 'prev-day':
          newStart = Math.max(0, timeline.startIndex - 24);
          break;
        case 'next-day':
          newStart = Math.min(totalHours - windowSize - 1, timeline.startIndex + 24);
          break;
      }
      
      setTimelineRange(newStart, newStart + windowSize);
    }
  };

  // Prepare chart data
  const getChartData = () => {
    const step = Math.max(1, Math.floor(totalHours / 100)); // Show max 100 data points
    const data = [];
    
    for (let i = 0; i < totalHours; i += step) {
      const isInRange = timeline.mode === 'range' && i >= timeline.startIndex && i <= timeline.endIndex;
      const isCurrent = timeline.mode === 'single' && Math.abs(i - timeline.currentIndex) < step;
      
      data.push({
        time: weatherData.hourly.time[i],
        temperature: weatherData.hourly.temperature_2m[i],
        humidity: weatherData.hourly.relative_humidity_2m[i],
        windSpeed: weatherData.hourly.wind_speed_10m[i],
        windDirection: weatherData.hourly.wind_direction_10m[i],
        isSelected: isInRange,
        isCurrent: isCurrent,
      });
    }
    
    return data;
  };

  const handleChartClick = (index: number) => {
    if (timeline.mode === 'single') {
      setCurrentIndex(index);
    }
  };

  const chartData = getChartData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Timeline Control</CardTitle>
            <div className="flex items-center space-x-4">
              {/* Polygon sync indicator */}
              {polygons.length > 0 && (
                <div className="flex items-center space-x-2 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span>{polygons.length} polygon{polygons.length !== 1 ? 's' : ''} synced</span>
                </div>
              )}
              
              {/* Mode Toggle */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Mode:</span>
                <Button
                  variant={timeline.mode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('single')}
                >
                  Single
                </Button>
                <Button
                  variant={timeline.mode === 'range' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('range')}
                >
                  Range
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                {timeline.mode === 'single' 
                  ? `Hour ${timeline.currentIndex + 1} of ${totalHours}`
                  : `Hours ${timeline.startIndex + 1}-${timeline.endIndex + 1} of ${totalHours} (${timeline.endIndex - timeline.startIndex + 1}h window)`
                }
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Time Display */}
          <div className="text-center">
            {timeline.mode === 'single' ? (
              <div className="text-xl font-mono bg-gray-100 rounded-lg py-2 px-4 inline-block">
                {formatTime(currentTime)}
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-4">
                <div className="text-lg font-mono bg-blue-100 rounded-lg py-2 px-3">
                  Start: {formatTimeShort(startTime)}
                </div>
                <div className="text-gray-500">to</div>
                <div className="text-lg font-mono bg-blue-100 rounded-lg py-2 px-3">
                  End: {formatTimeShort(endTime)}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Chart Visualization */}
          <WeatherChart
            data={chartData}
            type="timeline"
            title="Temperature & Humidity Timeline"
            selectedRange={timeline.mode === 'range' ? { start: timeline.startIndex, end: timeline.endIndex } : undefined}
            currentIndex={timeline.mode === 'single' ? timeline.currentIndex : undefined}
            onDataPointClick={handleChartClick}
          />

          {/* Progress Bar and Sliders */}
          <div className="relative">
            {timeline.mode === 'single' ? (
              // Single point slider
              <>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${singleProgress}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={totalHours - 1}
                  value={timeline.currentIndex}
                  onChange={handleSingleSliderChange}
                  className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                />
              </>
            ) : (
              // Dual-ended range slider
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 relative">
                  <div 
                    className="bg-blue-600 h-2 rounded-full absolute transition-all duration-300"
                    style={{ 
                      left: `${rangeStartProgress}%`, 
                      width: `${rangeEndProgress - rangeStartProgress}%` 
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={totalHours - 1}
                  value={timeline.startIndex}
                  onChange={handleRangeStartChange}
                  className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                  style={{ zIndex: 2 }}
                />
                <input
                  type="range"
                  min="0"
                  max={totalHours - 1}
                  value={timeline.endIndex}
                  onChange={handleRangeEndChange}
                  className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                  style={{ zIndex: 1 }}
                />
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            {/* Jump Controls */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => jumpToTime('start')}
              title="Jump to start"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => jumpToTime('prev-day')}
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant={timeline.isPlaying ? "destructive" : "default"}
              size="icon"
              onClick={togglePlayback}
            >
              {timeline.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => jumpToTime('next-day')}
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => jumpToTime('end')}
              title="Jump to end"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className="text-gray-600">Speed:</span>
            {[2000, 1000, 500, 250].map((speed) => (
              <Button
                key={speed}
                variant={timeline.playbackSpeed === speed ? "default" : "outline"}
                size="sm"
                onClick={() => handleSpeedChange(speed)}
              >
                {speed === 2000 ? '0.5x' : speed === 1000 ? '1x' : speed === 500 ? '2x' : '4x'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}