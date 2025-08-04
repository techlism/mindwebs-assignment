'use client';

import { useState, useEffect, useRef } from 'react';
import { useWeatherStore } from '@/lib/store';
import { searchLocations, fetchWeatherData, createMockWeatherData } from '@/lib/weather-api';
import { Location } from '@/types/weather';

export default function LocationSearch() {
  const { currentLocation, setCurrentLocation, setWeatherData, setLoading } = useWeatherStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchLocations(query);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Location search failed:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleLocationSelect = async (location: Location) => {
    setCurrentLocation(location);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Fetch weather data for the new location
    setLoading(true);
    try {
      const data = await fetchWeatherData(location);
      setWeatherData(data);
    } catch (error) {
      console.warn('Using mock data due to API error:', error);
      setWeatherData(createMockWeatherData(location));
    } finally {
      setLoading(false);
    }
  };

  const formatLocationName = (location: Location) => {
    const parts = [location.name];
    if (location.admin1 && location.admin1 !== location.name) {
      parts.push(location.admin1);
    }
    if (location.country) {
      parts.push(location.country);
    }
    return parts.join(', ');
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a city or location..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        {isSearching && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Current Location Display */}
      <div className="text-sm text-gray-600 mb-2">
        Current: <span className="font-medium">{formatLocationName(currentLocation)}</span>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {suggestions.map((location, index) => (
            <button
              key={index}
              onClick={() => handleLocationSelect(location)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium">{location.name}</div>
              <div className="text-xs text-gray-500">
                {[location.admin1, location.country].filter(Boolean).join(', ')}
              </div>
              <div className="text-xs text-gray-400">
                {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 px-3 py-2 text-sm text-gray-500">
          No locations found for "{query}"
        </div>
      )}
    </div>
  );
}