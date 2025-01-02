// components/Map/Search.tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SearchResult } from '../../types/map';
import { searchLocation } from '../../utils/locationUtils';

interface SearchProps {
  onLocationSelect: (result: SearchResult) => void;
  className?: string;
}

export const Search: React.FC<SearchProps> = ({ onLocationSelect, className }) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle search with debouncing
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await searchLocation(searchQuery);
      setResults(response.features);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, handleSearch]);

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    onLocationSelect(result);
    setQuery('');
    setResults([]);
  };

  return (
    <div className={`relative ${className || ''}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="absolute w-full mt-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100"
            >
              <p className="font-medium text-gray-900">{result.text}</p>
              <p className="text-sm text-gray-600">{result.place_name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;