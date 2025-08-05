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

  // Listen for drawing mode toggle from external controls
  useEffect(() => {
    const handleToggleDrawingMode = (event: CustomEvent) => {
      const { isDrawing: newDrawingState } = event.detail;
      if (newDrawingState) {
        startDrawing();
      } else {
        cancelDrawing();
      }
    };

    window.addEventListener('toggleDrawingMode', handleToggleDrawingMode as EventListener);
    return () => {
      window.removeEventListener('toggleDrawingMode', handleToggleDrawingMode as EventListener);
    };
  }, []);

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