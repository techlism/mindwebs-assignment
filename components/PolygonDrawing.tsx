'use client';

import { useState, useEffect } from 'react';
import { useMapEvents, Polygon as LeafletPolygonComponent } from 'react-leaflet';
import { useWeatherStore } from '@/lib/store';
import { Polygon } from '@/types/weather';
import { LatLngBounds } from 'leaflet';

// Utility function to check if a point is inside a polygon
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Check if two polygons overlap
function polygonsOverlap(poly1: [number, number][], poly2: [number, number][]): boolean {
  // Check if any point of poly1 is inside poly2
  for (const point of poly1) {
    if (pointInPolygon(point, poly2)) {
      return true;
    }
  }
  
  // Check if any point of poly2 is inside poly1
  for (const point of poly2) {
    if (pointInPolygon(point, poly1)) {
      return true;
    }
  }
  
  return false;
}

export default function PolygonDrawing() {
  const { addPolygon, removePolygon, polygons, weatherData, timeline } = useWeatherStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);
  const [selectedPolygon, setSelectedPolygon] = useState<string | null>(null);
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<[number, number][] | null>(null);

  const generateId = () => `polygon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const generateColor = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Calculate statistics for a polygon based on current timeline
  const calculatePolygonStats = (coordinates: [number, number][]) => {
    if (!weatherData) return undefined;

    // For demo purposes, generate mock statistics based on current weather data
    const currentTemp = weatherData.hourly.temperature_2m[timeline.currentIndex] || 15;
    const variation = (Math.random() - 0.5) * 10; // ±5°C variation
    
    return {
      min: Math.round((currentTemp + variation - 5) * 10) / 10,
      max: Math.round((currentTemp + variation + 5) * 10) / 10,
      average: Math.round((currentTemp + variation) * 10) / 10,
      count: coordinates.length,
    };
  };

  const map = useMapEvents({
    click(e) {
      if (!isDrawing) return;

      // Check if we've reached the maximum number of points (8)
      if (currentPoints.length >= 8) {
        // Force completion at 8 points
        completePolygon(currentPoints);
        return;
      }

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
      e.originalEvent.preventDefault();
      if (isDrawing && currentPoints.length >= 3) {
        completePolygon(currentPoints);
      }
    },
  });

  const checkForOverlaps = (newPolygonCoords: [number, number][]): boolean => {
    return polygons.some(existingPolygon => 
      polygonsOverlap(newPolygonCoords, existingPolygon.coordinates)
    );
  };

  const completePolygon = (points: [number, number][]) => {
    if (points.length < 3) return;

    // Check for overlaps
    const hasOverlap = checkForOverlaps(points);
    
    if (hasOverlap) {
      setPendingPolygon(points);
      setShowOverlapWarning(true);
      return;
    }

    createPolygon(points);
  };

  const createPolygon = (points: [number, number][]) => {
    const statistics = calculatePolygonStats(points);
    const estimatedTemp = statistics?.average || 15;

    const newPolygon: Polygon = {
      id: generateId(),
      coordinates: points,
      color: generateColor(),
      temperature: estimatedTemp,
      dataSource: 'temperature_2m',
      thresholds: [
        { operator: '<', value: 18, color: '#3b82f6' },
        { operator: '>=', value: 18, color: '#10b981' },
        { operator: '>=', value: 25, color: '#f59e0b' },
        { operator: '>=', value: 30, color: '#ef4444' },
      ],
      statistics,
    };

    addPolygon(newPolygon);
    setCurrentPoints([]);
    setIsDrawing(false);
    setPendingPolygon(null);
    setShowOverlapWarning(false);
  };

  const handleOverlapDecision = (forceCreate: boolean) => {
    if (forceCreate && pendingPolygon) {
      createPolygon(pendingPolygon);
    } else {
      setPendingPolygon(null);
      setShowOverlapWarning(false);
    }
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setCurrentPoints([]);
    setSelectedPolygon(null);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPoints([]);
    setShowOverlapWarning(false);
    setPendingPolygon(null);
  };

  const handlePolygonDelete = (polygonId: string) => {
    removePolygon(polygonId);
    if (selectedPolygon === polygonId) {
      setSelectedPolygon(null);
    }
  };

  return (
    <>
      {/* Drawing controls */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border z-[1000] max-w-sm">
        {!isDrawing ? (
          <div className="space-y-2">
            <button
              onClick={startDrawing}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Draw Area</span>
            </button>
            
            {/* Polygon List */}
            {polygons.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Drawn Areas ({polygons.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {polygons.map((polygon) => (
                    <div
                      key={polygon.id}
                      className={`flex items-center justify-between p-2 rounded text-xs border ${
                        selectedPolygon === polygon.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: polygon.color }}
                        />
                        <span className="text-gray-700">
                          Area {polygons.indexOf(polygon) + 1}
                        </span>
                        {polygon.statistics && (
                          <span className="text-gray-500">
                            ({polygon.statistics.average.toFixed(1)}°C)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handlePolygonDelete(polygon.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete polygon"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Drawing Mode</div>
            <div className="text-xs text-gray-500">
              Click to add points (min 3, max 8 required)
              <br />
              Double-click or click near start to finish
            </div>
            <div className="text-xs text-blue-600">
              Points: {currentPoints.length}/8
              {currentPoints.length >= 3 && <span className="text-green-600"> ✓ Ready</span>}
              {currentPoints.length >= 8 && <span className="text-orange-600"> (Max reached - will auto-complete)</span>}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={cancelDrawing}
                className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              >
                Cancel
              </button>
              {currentPoints.length >= 3 && (
                <button
                  onClick={() => completePolygon(currentPoints)}
                  className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlap Warning Modal */}
      {showOverlapWarning && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1010]">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Polygon Overlap Detected
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              The area you're trying to create overlaps with an existing polygon. 
              Overlapping areas may produce inaccurate data analysis.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleOverlapDecision(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOverlapDecision(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Create Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render current drawing polygon preview */}
      {isDrawing && currentPoints.length > 2 && (
        <LeafletPolygonComponent
          positions={[...currentPoints, currentPoints[0]]} // Close the polygon preview
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5', // Dashed line for preview
          }}
        />
      )}
    </>
  );
}