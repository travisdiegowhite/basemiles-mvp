// utils/routeUtils.ts

import { RoutePreferences, Coordinate } from '../types/map';

/**
 * Format distance in meters to human readable format
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Format duration in seconds to human readable format
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

/**
 * Clean up maneuver instructions for display
 */
export const cleanInstruction = (instruction: string): string => {
  return instruction
    .replace(/{.+?}/g, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
};

/**
 * Get route parameters based on preferences
 */
export const getRouteParams = (prefs: RoutePreferences): URLSearchParams => {
  const params = new URLSearchParams({
    geometries: 'geojson',
    steps: 'true',
    overview: 'full',
    alternatives: 'true',
    access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
  });

  // Add basic annotations
  params.append('annotations', 'distance,duration');

  // Add basic routing preferences
  switch (prefs.type) {
    case 'quietest':
      params.append('exclude', 'motorway');
      break;
    case 'fastest':
      params.append('continue_straight', 'true');
      break;
  }

  // Add surface preferences
  if (prefs.surface === 'paved') {
    params.append('exclude', 'unpaved');
  }

  // Add hill preferences
  if (prefs.hills === 'avoid') {
    params.append('avoid_features', 'steep');
  }

  return params;
};

/**
 * Format route type for display
 */
export const formatRouteType = (type: RoutePreferences['type']): string => {
  switch (type) {
    case 'fastest':
      return 'Fastest Route';
    case 'quietest':
      return 'Quietest Route';
    default:
      return 'Balanced Route';
  }
};

/**
 * Get color for route based on type
 */
export const getRouteColor = (isSelected: boolean, isAlternative: boolean): string => {
  if (isSelected) {
    return '#3b82f6';  // blue-500
  }
  if (isAlternative) {
    return '#94a3b8';  // gray-400
  }
  return '#3b82f6';    // Default blue
};

/**
 * Format coordinate for display in UI
 */
export const formatCoordinate = (coord: Coordinate): string => {
  const [lat, lng] = coord;
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
};

/**
 * Generate search URL with appropriate parameters
 */
export const getSearchUrl = (query: string): string => {
  const params = new URLSearchParams({
    access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
    types: 'place,address,poi',
    limit: '5',
    language: 'en'
  });

  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
};

/**
 * Validate coordinates are within bounds
 */
export const isValidCoordinate = (coord: Coordinate): boolean => {
  const [lat, lng] = coord;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

/**
 * Calculate bounding box for a set of coordinates
 */
export const calculateBounds = (coordinates: Coordinate[]): [Coordinate, Coordinate] => {
  if (!coordinates.length) {
    throw new Error('No coordinates provided');
  }

  const lats = coordinates.map(([lat]) => lat);
  const lngs = coordinates.map(([, lng]) => lng);

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ];
};