'use client';

import { useEffect, useRef } from 'react';
import { useWeatherStore } from '@/lib/store';

export default function Timeline() {
  const {
    weatherData,
    timeline,
    setCurrentIndex,
    togglePlayback,
    setPlaybackSpeed,
  } = useWeatherStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance timeline when playing
  useEffect(() => {
    if (timeline.isPlaying && weatherData) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((timeline.currentIndex + 1) % weatherData.hourly.time.length);
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
  }, [timeline.isPlaying, timeline.currentIndex, timeline.playbackSpeed, weatherData, setCurrentIndex]);

  if (!weatherData) return null;

  const totalHours = weatherData.hourly.time.length;
  const currentTime = weatherData.hourly.time[timeline.currentIndex];
  const progress = (timeline.currentIndex / totalHours) * 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value);
    setCurrentIndex(newIndex);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
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

  const jumpToTime = (direction: 'start' | 'end' | 'prev-day' | 'next-day') => {
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Timeline Control</h3>
        <div className="text-sm text-gray-600">
          Hour {timeline.currentIndex + 1} of {totalHours}
        </div>
      </div>

      {/* Current Time Display */}
      <div className="text-center">
        <div className="text-xl font-mono bg-gray-100 rounded-lg py-2 px-4 inline-block">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={totalHours - 1}
          value={timeline.currentIndex}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
        />
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