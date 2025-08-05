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
      {/* Enhanced Draw Area Button */}
      <div className="space-y-2">
        <Button
          onClick={toggleDrawingMode}
          className={`w-full font-medium transition-all duration-200 ${
            isDrawingMode 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
          }`}
          size="default"
        >
          {isDrawingMode ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Cancel Drawing
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
              </svg>
              Draw New Area
            </>
          )}
        </Button>
        
        {!isDrawingMode && polygons.length === 0 && (
          <p className="text-xs text-gray-500 text-center">
            Draw custom areas to analyze weather patterns
          </p>
        )}
      </div>
      
      {isDrawingMode && (
        <div className="text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
          <p className="font-medium text-blue-800 mb-2 flex items-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
            Drawing Mode Active
          </p>
          <div className="text-xs text-blue-700 space-y-1">
            <p>🖱️ Click on the map to add points (minimum 3 required)</p>
            <p>🖱️ Double-click or click near start point to finish</p>
            <p>📊 Area will automatically calculate weather statistics</p>
          </div>
        </div>
      )}

      {/* Enhanced Polygon List */}
      {polygons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-gray-700 flex items-center">
              <svg className="w-4 h-4 mr-1 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
              Drawn Areas
            </h5>
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
              {polygons.length}
            </span>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
            {polygons.map((polygon, index) => (
              <div
                key={polygon.id}
                className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: polygon.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-800">
                        Area {index + 1}
                      </span>
                      {polygon.statistics && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {polygon.statistics.average.toFixed(1)}°C avg
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {polygon.thresholds.length} threshold{polygon.thresholds.length !== 1 ? 's' : ''} • 
                      {polygon.dataSource.replace('_', ' ').replace('2m', '')}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handlePolygonDelete(polygon.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 ml-2"
                  title={`Delete Area ${index + 1}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </Button>
              </div>
            ))}
          </div>
          
          {polygons.length > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700 border border-green-200">
              <p className="font-medium">✅ Areas are synced with timeline</p>
              <p>Configure thresholds and view statistics in the sidebar →</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}