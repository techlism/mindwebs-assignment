'use client';

import { useState, useEffect, useRef } from 'react';
import { useWeatherStore } from '@/lib/store';
import { searchLocations, fetchWeatherData, createMockWeatherData } from '@/lib/weather-api';
import { Location } from '@/types/weather';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LocationSearch() {
  const { currentLocation, setCurrentLocation, setWeatherData, setLoading } = useWeatherStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    <div className="space-y-3">
      <div className="relative" ref={searchRef}>
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a city or location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 max-h-64 overflow-y-auto">
            <CardContent className="p-0">
              {suggestions.map((location, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => handleLocationSelect(location)}
                  className="w-full justify-start p-3 h-auto border-b border-gray-100 last:border-b-0 rounded-none"
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">{location.name}</div>
                    <div className="text-xs text-gray-500">
                      {[location.admin1, location.country].filter(Boolean).join(', ')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No results message */}
        {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isSearching && (
          <Card className="absolute top-full left-0 right-0 z-50">
            <CardContent className="p-3 text-sm text-gray-500">
              No locations found for "{query}"
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current Location Display */}
      <Card>
        <CardContent className="p-3">
          <div className="text-sm">
            <span className="text-gray-600">Current: </span>
            <span className="font-medium">{formatLocationName(currentLocation)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}