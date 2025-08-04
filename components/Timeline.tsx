'use client';

import { useEffect, useRef, useState } from 'react';
import { useWeatherStore } from '@/lib/store';

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

  // Generate histogram data for visualization
  const generateHistogramData = () => {
    const data = [];
    const step = Math.max(1, Math.floor(totalHours / 100)); // Show max 100 bars
    
    for (let i = 0; i < totalHours; i += step) {
      const temp = weatherData.hourly.temperature_2m[i];
      const time = weatherData.hourly.time[i];
      data.push({
        index: i,
        temperature: temp,
        time: time,
        isInRange: timeline.mode === 'range' && i >= timeline.startIndex && i <= timeline.endIndex,
        isCurrent: timeline.mode === 'single' && Math.abs(i - timeline.currentIndex) < step,
      });
    }
    
    return data;
  };

  const histogramData = generateHistogramData();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Timeline Control</h3>
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
            <button
              onClick={() => handleModeChange('single')}
              className={`px-3 py-1 rounded ${
                timeline.mode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => handleModeChange('range')}
              className={`px-3 py-1 rounded ${
                timeline.mode === 'range'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Range
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            {timeline.mode === 'single' 
              ? `Hour ${timeline.currentIndex + 1} of ${totalHours}`
              : `Hours ${timeline.startIndex + 1}-${timeline.endIndex + 1} of ${totalHours} (${timeline.endIndex - timeline.startIndex + 1}h window)`
            }
          </div>
        </div>
      </div>

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

      {/* Histogram Visualization */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Temperature Timeline</h4>
        <div className="flex items-end justify-between h-16 space-x-1">
          {histogramData.map((item, index) => {
            const height = Math.max(10, (item.temperature + 10) * 2); // Normalize height
            const maxHeight = 60;
            const normalizedHeight = Math.min(height, maxHeight);
            
            return (
              <div
                key={index}
                className={`flex-1 rounded-t transition-all duration-200 cursor-pointer ${
                  item.isCurrent 
                    ? 'bg-red-500' 
                    : item.isInRange 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300 hover:bg-gray-400'
                }`}
                style={{ height: `${normalizedHeight}px` }}
                title={`${formatTimeShort(item.time)}: ${item.temperature?.toFixed(1)}°C`}
                onClick={() => {
                  if (timeline.mode === 'single') {
                    setCurrentIndex(item.index);
                  }
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTimeShort(weatherData.hourly.time[0])}</span>
          <span>{formatTimeShort(weatherData.hourly.time[totalHours - 1])}</span>
        </div>
      </div>

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
        <button
          onClick={() => jumpToTime('start')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          title="Jump to start"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h1a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM7.707 7.293a1 1 0 010 1.414L5.414 11l2.293 2.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"/>
          </svg>
        </button>

        <button
          onClick={() => jumpToTime('prev-day')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          title="Previous day"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlayback}
          className={`p-3 rounded-full text-white font-medium ${
            timeline.isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {timeline.isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
            </svg>
          )}
        </button>

        <button
          onClick={() => jumpToTime('next-day')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          title="Next day"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          </svg>
        </button>

        <button
          onClick={() => jumpToTime('end')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          title="Jump to end"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 6a1 1 0 011 1v6a1 1 0 01-1 1h-1a1 1 0 01-1-1V7a1 1 0 011-1h1zM12.293 12.707a1 1 0 010-1.414L14.586 9l-2.293-2.293a1 1 0 111.414-1.414l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414 0z"/>
          </svg>
        </button>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center justify-center space-x-4 text-sm">
        <span className="text-gray-600">Speed:</span>
        {[2000, 1000, 500, 250].map((speed) => (
          <button
            key={speed}
            onClick={() => handleSpeedChange(speed)}
            className={`px-3 py-1 rounded ${
              timeline.playbackSpeed === speed
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {speed === 2000 ? '0.5x' : speed === 1000 ? '1x' : speed === 500 ? '2x' : '4x'}
          </button>
        ))}
      </div>
    </div>
  );
}