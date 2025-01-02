// utils/locationUtils.ts

import type { Coordinate, GeocodingResponse, LocationError } from '../types/map';

/**
 * Search for locations using Mapbox Geocoding API
 */
export const searchLocation = async (query: string): Promise<GeocodingResponse> => {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  const params = new URLSearchParams({
    access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
    types: 'place,address,poi',
    limit: '5',
    language: 'en'
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
  const response = await fetch(`${url}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }

  return response.json();
};

/**
 * Get user's current location
 */
export const getCurrentLocation = (): Promise<Coordinate> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported'
      } as LocationError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        const locationError: LocationError = {
          code: error.code,
          message: error.message
        };
        reject(locationError);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Handle geolocation errors
 */
export const handleLocationError = (error: LocationError): string => {
  switch (error.code) {
    case 1:
      return 'Location access denied by user';
    case 2:
      return 'Location unavailable';
    case 3:
      return 'Location request timed out';
    default:
      return error.message || 'Failed to get location';
  }
};

/**
 * Check if coordinates are near each other
 */
export const isNearLocation = (coord1: Coordinate, coord2: Coordinate, radiusKm: number = 0.1): boolean => {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= radiusKm;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return degrees * Math.PI / 180;
};