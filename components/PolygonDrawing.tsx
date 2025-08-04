'use client';

import { useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { useWeatherStore } from '@/lib/store';
import { Polygon } from '@/types/weather';

export default function PolygonDrawing() {
  const { addPolygon, weatherData, timeline } = useWeatherStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);

  const generateId = () => `polygon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const generateColor = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const map = useMapEvents({
    click(e) {
      if (!isDrawing) return;

      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      const updatedPoints = [...currentPoints, newPoint];
      setCurrentPoints(updatedPoints);

      // Complete polygon if we have at least 3 points and click near the first point
      if (updatedPoints.length >= 3) {
        const firstPoint = updatedPoints[0];
        const distance = map.distance(e.latlng, { lat: firstPoint[0], lng: firstPoint[1] });
        
        // If clicked within 100 meters of the first point, complete the polygon
        if (distance < 100) {
          completePolygon(updatedPoints);
        }
      }
    },
    
    dblclick(e) {
      if (isDrawing && currentPoints.length >= 3) {
        completePolygon(currentPoints);
      }
    },
  });

  const completePolygon = (points: [number, number][]) => {
    if (points.length < 3) return;

    // Calculate estimated temperature for the polygon area (simple average of current temp with some variation)
    const currentTemp = weatherData?.hourly.temperature_2m[timeline.currentIndex] || 15;
    const estimatedTemp = currentTemp + (Math.random() - 0.5) * 4; // ±2°C variation

    const newPolygon: Polygon = {
      id: generateId(),
      coordinates: points,
      color: generateColor(),
      temperature: estimatedTemp,
    };

    addPolygon(newPolygon);
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setCurrentPoints([]);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  return (
    <>
      {/* Drawing controls */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg border z-[1000]">
        {!isDrawing ? (
          <button
            onClick={startDrawing}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Draw Area</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Drawing Mode</div>
            <div className="text-xs text-gray-500 mb-2">
              Click to add points, double-click or click near start to finish
            </div>
            <div className="text-xs text-blue-600 mb-2">
              Points: {currentPoints.length}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={cancelDrawing}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              >
                Cancel
              </button>
              {currentPoints.length >= 3 && (
                <button
                  onClick={() => completePolygon(currentPoints)}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Render current drawing polygon preview */}
      {isDrawing && currentPoints.length > 0 && (
        <>
          {/* This would show a preview line, but react-leaflet makes this complex */}
          {/* For now, just show the points being collected */}
        </>
      )}
    </>
  );
}