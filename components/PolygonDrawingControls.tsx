'use client';

import { useState } from 'react';
import { useWeatherStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export default function PolygonDrawingControls() {
  const { polygons, removePolygon } = useWeatherStore();
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    // Dispatch a custom event to notify the PolygonDrawing component
    window.dispatchEvent(new CustomEvent('toggleDrawingMode', { 
      detail: { isDrawing: !isDrawingMode } 
    }));
  };

  const handlePolygonDelete = (polygonId: string) => {
    removePolygon(polygonId);
  };

  return (
    <div className="space-y-4">
      {/* Draw Area Button */}
      <Button
        onClick={toggleDrawingMode}
        className={`w-full ${isDrawingMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isDrawingMode ? 'Cancel Drawing' : 'Draw Area'}
      </Button>
      
      {isDrawingMode && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Drawing Mode Active</p>
          <p className="text-xs">Click on the map to add points (min 3 required)</p>
          <p className="text-xs">Double-click or click near start to finish</p>
        </div>
      )}

      {/* Polygon List */}
      {polygons.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            Drawn Areas ({polygons.length})
          </h5>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {polygons.map((polygon) => (
              <div
                key={polygon.id}
                className="flex items-center justify-between p-2 rounded text-xs border border-gray-200 hover:bg-gray-50"
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
                <Button
                  onClick={() => handlePolygonDelete(polygon.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                  title="Delete polygon"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}