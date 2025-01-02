// types/map.ts

// Basic coordinate type
export type Coordinate = [number, number];

// Route preferences interface
export interface RoutePreferences {
  hills: 'avoid' | 'prefer' | 'none';
  type: 'fastest' | 'quietest' | 'balanced';
  surface: 'paved' | 'any';
}

// Step in the route
export interface RouteStep {
  distance: number;
  duration: number;
  maneuver: {
    instruction: string;
    location: Coordinate;
    type: string;
    modifier?: string;
  };
  name: string;
  mode?: string;
  geometry: {
    coordinates: Coordinate[];
    type: string;
  };
}

// Route leg (section between two waypoints)
export interface RouteLeg {
  steps: RouteStep[];
  distance: number;
  duration: number;
  summary: string;
  weight: number;
}

// Complete route data
export interface RouteData {
  distance: number;
  duration: number;
  geometry: {
    coordinates: Coordinate[];
    type: string;
  };
  legs: RouteLeg[];
  weight_name: string;
  weight: number;
  duration_typical?: number;
  alternatives?: RouteData[];
}

// Alternative route type
export interface AlternativeRoute extends RouteData {
  isAlternative: true;
  originalIndex: number;
}

// Map component props
export interface MapComponentProps {
  initialCenter?: Coordinate;
  zoom?: number;
  defaultRouteType?: 'cycling' | 'walking';
}

// Route analysis data
export interface RouteAnalysis {
  distance: number;
  duration: number;
  averageSpeed: number;
  difficulty: string;
  surfaceTypes: {
    type: string;
    distance: number;
    percentage: number;
  }[];
}

// Route comparison result
export interface RouteComparison {
  distanceDiff: string;
  durationDiff: string;
  speedDiff: string;
  mainFeatures: string[];
}

// Search related types
export interface SearchResult {
  id: string;
  type: string;
  place_name: string;
  text: string;
  center: Coordinate;
  properties: {
    address?: string;
    category?: string;
    maki?: string;
  };
  context?: Array<{
    id: string;
    text: string;
    wikidata?: string;
    short_code?: string;
  }>;
}

export interface GeocodingResponse {
  type: string;
  features: SearchResult[];
  attribution: string;
  query: string[];
}

export interface LocationError {
  code: number;
  message: string;
  PERMISSION_DENIED?: number;
  POSITION_UNAVAILABLE?: number;
  TIMEOUT?: number;
}