// File: types/map.ts

// Defines a waypoint in our routing system
export interface WayPoint {
    coordinates: [number, number];  // [longitude, latitude]
    id: string;
  }
  
  // Describes a maneuver (turn, continue, etc.) in the route
  export interface RouteManeuver {
    instruction: string;
    type: string;
    modifier?: string;
    location: [number, number];
  }
  
  // Represents a single step in the route with its properties
  export interface RouteStep {
    maneuver: RouteManeuver;
    distance: number;
    duration: number;
    name: string;
    mode: string;  // type of road/path
    geometry: {
      coordinates: [number, number][];
    };
  }
  
  // A leg represents a section of the route between two waypoints
  export interface RouteLeg {
    steps: RouteStep[];
    distance: number;
    duration: number;
    summary: string;
  }
  
  // Complete route details including all segments and metadata
  export interface RouteDetails {
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    legs: RouteLeg[];
    distance: number;
    duration: number;
    weight: number;
    weight_name: string;
  }
  
  // Properties specific to different path types
  export interface PathTypeInfo {
    color: string;
    description: string;
    safetyScore: number;
  }
  
  // Configuration options for the map component
  export interface MapComponentProps {
    initialCenter?: [number, number];
    zoom?: number;
    routeType?: 'cycling' | 'walking';
  }
  
  // Elevation data point structure
  export interface ElevationPoint {
    distance: number;  // Distance from start in meters
    elevation: number; // Elevation in meters
    gradient: number;  // Gradient as percentage
  }
  
  // Complete route analysis including elevation and safety
  export interface RouteAnalysis {
    totalDistance: number;
    totalDuration: number;
    totalAscent: number;
    totalDescent: number;
    maxGradient: number;
    averageGradient: number;
    pathTypes: {
      type: string;
      distance: number;
      percentage: number;
    }[];
    elevationProfile: ElevationPoint[];
    safetyScore: number;
  }