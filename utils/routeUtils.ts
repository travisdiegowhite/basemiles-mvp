// File: utils/routeUtils.ts
import type { RouteStep, PathTypeInfo, RouteAnalysis, ElevationPoint } from '../types/map';

/**
 * Determines the type and characteristics of a path segment based on its properties
 */
export function getPathTypeInfo(step: RouteStep): PathTypeInfo {
  const mode = step.mode.toLowerCase();
  const name = step.name.toLowerCase();

  // Dedicated cycling infrastructure
  if (mode.includes('cycleway') || name.includes('bike') || name.includes('trail')) {
    return {
      color: '#22c55e',  // Green for safest paths
      description: 'Dedicated bike path',
      safetyScore: 1.0
    };
  }
  
  // Quiet residential streets
  if (mode.includes('residential') || mode.includes('tertiary')) {
    return {
      color: '#3b82f6',  // Blue for bike-friendly roads
      description: 'Bike-friendly road',
      safetyScore: 0.8
    };
  }

  // Busier roads that still accommodate cyclists
  if (mode.includes('secondary') || mode.includes('primary')) {
    return {
      color: '#eab308',  // Yellow for shared roads
      description: 'Shared road with bike accommodation',
      safetyScore: 0.6
    };
  }

  // Default for other road types
  return {
    color: '#ef4444',  // Red for less ideal cycling conditions
    description: 'Regular road',
    safetyScore: 0.4
  };
}

/**
 * Formats a distance in meters to a human-readable string
 */
export function formatDistance(meters: number, useMetric: boolean = true): string {
  if (useMetric) {
    if (meters >= 1000) {
      return `${(meters/1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  } else {
    const miles = meters * 0.000621371;
    if (miles >= 1) {
      return `${miles.toFixed(1)} mi`;
    }
    return `${Math.round(meters * 3.28084)} ft`;
  }
}

/**
 * Formats a duration in seconds to a human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculates elevation statistics for a series of elevation points
 */
function calculateElevationStats(elevations: number[]): {
  totalAscent: number;
  totalDescent: number;
  maxGradient: number;
  averageGradient: number;
} {
  let totalAscent = 0;
  let totalDescent = 0;
  let maxGradient = 0;
  let totalGradient = 0;
  let gradientCount = 0;

  for (let i = 1; i < elevations.length; i++) {
    const elevation_diff = elevations[i] - elevations[i-1];
    if (elevation_diff > 0) {
      totalAscent += elevation_diff;
    } else {
      totalDescent += Math.abs(elevation_diff);
    }

    // Calculate gradient (assuming 10m intervals)
    const gradient = (elevation_diff / 10) * 100;
    maxGradient = Math.max(maxGradient, Math.abs(gradient));
    totalGradient += Math.abs(gradient);
    gradientCount++;
  }

  return {
    totalAscent,
    totalDescent,
    maxGradient,
    averageGradient: totalGradient / gradientCount
  };
}

/**
 * Creates a comprehensive analysis of a route including elevation and safety
 */
export function analyzeRoute(
  steps: RouteStep[],
  elevationProfile: number[],
  totalDistance: number,
  totalDuration: number
): RouteAnalysis {
  // Initialize counters for different path types
  const pathTypeCounts: Record<string, number> = {};
  let totalSafetyScore = 0;

  // Analyze each step of the route
  steps.forEach(step => {
    const pathInfo = getPathTypeInfo(step);
    pathTypeCounts[pathInfo.description] = (pathTypeCounts[pathInfo.description] || 0) + step.distance;
    totalSafetyScore += pathInfo.safetyScore * step.distance;
  });

  // Calculate elevation statistics
  const elevationStats = calculateElevationStats(elevationProfile);

  // Create elevation profile points
  const elevationPoints: ElevationPoint[] = elevationProfile.map((elevation, index) => {
    const distance = (index * totalDistance) / elevationProfile.length;
    const nextElevation = elevationProfile[index + 1];
    const gradient = nextElevation 
      ? ((nextElevation - elevation) / 10) * 100 
      : 0;

    return {
      distance,
      elevation,
      gradient
    };
  });

  // Convert path type counts to percentages
  const pathTypes = Object.entries(pathTypeCounts).map(([type, distance]) => ({
    type,
    distance,
    percentage: (distance / totalDistance * 100)
  }));

  return {
    totalDistance,
    totalDuration,
    totalAscent: elevationStats.totalAscent,
    totalDescent: elevationStats.totalDescent,
    maxGradient: elevationStats.maxGradient,
    averageGradient: elevationStats.averageGradient,
    pathTypes,
    elevationProfile: elevationPoints,
    safetyScore: totalSafetyScore / totalDistance
  };
}