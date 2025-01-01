// utils/routeUtils.ts
import { RoutePreferences } from '../types/map';

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