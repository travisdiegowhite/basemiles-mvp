// File: components/Map/MapComponent.tsx
// Purpose: Main map component for route planning and visualization
// This component handles map display, route creation, distance calculations,
// and user interactions for creating walking or cycling routes.

import { useEffect, useRef, useState, FC, ReactElement } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Core type definitions for map functionality
type Map = any;  // In production, we'd want to properly type this from mapbox-gl
type Marker = any;
type LngLat = { lng: number; lat: number };
type MapMouseEvent = { lngLat: LngLat };

// Define the structure for each point in our route
interface RoutePoint {
  id: string;  // Unique identifier for each point
  coordinates: [number, number];  // [longitude, latitude] in Mapbox format
}

// Define the structure for route details returned by Mapbox Directions API
interface RouteDetails {
  distance: number;  // Distance in meters
  duration: number;  // Duration in seconds
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
}

// Define the props our component accepts
interface Props {
  onRouteSave?: (route: {
    points: RoutePoint[];
    details: RouteDetails | null;
  }) => void;
}

// Module-level variable for Mapbox GL JS instance
let mapboxgl: any;

const MapComponent: FC<Props> = ({ onRouteSave }): ReactElement => {
  // State Management
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  const [routeType, setRouteType] = useState<'walking' | 'cycling'>('walking');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Refs for managing persistent values
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const routeRef = useRef<any>(null);

  // Initialize map with retry logic for better reliability
  const initializeMap = async () => {
    try {
      // Dynamically import Mapbox GL JS to avoid SSR issues
      const mapboxModule = await import('mapbox-gl');
      mapboxgl = mapboxModule.default;
      
      if (!mapContainer.current || map.current) return;

      let retryCount = 0;
      const maxRetries = 3;

      const createMap = async () => {
        try {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-95, 40],  // Default center (USA)
            zoom: 4,
            accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
            failIfMajorPerformanceCaveat: false,
            refreshExpiredTiles: false
          });

          // Add error handling for map load failures
          map.current.on('error', (e: Error) => {
            console.error('Map error:', e);
            if (map.current && !map.current.loaded() && retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying map initialization (${retryCount}/${maxRetries})...`);
              map.current.remove();
              createMap();
            }
          });

          // Add navigation controls and initialize map features
          map.current.addControl(new mapboxgl.NavigationControl());

          map.current.on('load', () => {
            setMapLoaded(true);
            setupMapLayers();
            getUserLocation();
          });

          // Add click handler for route point creation
          map.current.on('click', handleMapClick);
        } catch (error) {
          console.error('Error in createMap:', error);
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying map initialization (${retryCount}/${maxRetries})...`);
            setTimeout(createMap, 1000 * retryCount); // Exponential backoff
          }
        }
      };

      await createMap();
    } catch (error) {
      console.error('Error in initializeMap:', error);
    }
  };

  // Setup map layers for route visualization
  const setupMapLayers = () => {
    if (!map.current) return;

    // Add source for route line
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    // Add visual layer for route line
    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': routeType === 'cycling' ? '#3b82f6' : '#10b981',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    routeRef.current = map.current.getSource('route');
  };

  // Center map on user's location if available
  const getUserLocation = () => {
    if (!map.current || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 13
        });
      },
      (error) => console.error('Geolocation error:', error)
    );
  };

  // Handle map clicks to add new route points
  const handleMapClick = (e: MapMouseEvent) => {
    const newPoint: RoutePoint = {
      id: crypto.randomUUID(),
      coordinates: [e.lngLat.lng, e.lngLat.lat]
    };
    setPoints(prev => [...prev, newPoint]);
  };

  // Update markers and route when points change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers for each point
    points.forEach((point, index) => {
      const el = document.createElement('div');
      el.className = 'w-3 h-3 rounded-full border-2 border-white shadow';
      
      // Color coding for start, end, and waypoints
      el.style.backgroundColor = 
        index === 0 ? '#22c55e' : // Start point (green)
        index === points.length - 1 ? '#ef4444' : // End point (red)
        '#3b82f6'; // Waypoint (blue)

      // Create draggable marker
      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat(point.coordinates)
        .addTo(map.current!);

      // Update point position when marker is dragged
      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();
        setPoints(prev => prev.map((p, i) => 
          i === index ? { ...p, coordinates: [newLngLat.lng, newLngLat.lat] } : p
        ));
      });

      markersRef.current.push(marker);
    });

    // Fetch route if we have at least 2 points
    if (points.length >= 2) {
      fetchRoute();
    }
  }, [points, routeType]);

  // Format distance with proper units
  const formatDistance = (meters: number) => {
    if (unit === 'km') {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${(meters / 1609.344).toFixed(2)} mi`;
  };

  // Fetch route data from Mapbox Directions API
  const fetchRoute = async () => {
    if (points.length < 2) return;

    const coordinates = points.map(p => p.coordinates.join(',')).join(';');
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${routeType}/${coordinates}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      );

      if (!response.ok) throw new Error('Failed to fetch route');

      const data = await response.json();
      const route = data.routes[0];

      setRouteDetails(route);
      
      // Update route visualization
      if (routeRef.current) {
        routeRef.current.setData({
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // Clear the current route
  const handleClear = () => {
    setPoints([]);
    setRouteDetails(null);
    if (routeRef.current) {
      routeRef.current.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
    }
  };

  // Toggle between kilometers and miles
  const toggleUnit = () => setUnit(prev => prev === 'km' ? 'mi' : 'km');

  // Toggle between walking and cycling routes
  const toggleRouteType = () => {
    setRouteType(prev => prev === 'walking' ? 'cycling' : 'walking');
    if (points.length >= 2) {
      fetchRoute(); // Refetch route with new type
    }
  };

  // Initialize map and handle cleanup
  useEffect(() => {
    initializeMap();

    return () => {
      if (map.current) {
        // Clean up event listeners
        map.current.off('load');
        map.current.off('error');
        map.current.off('click', handleMapClick);
        
        // Remove markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        
        // Remove map
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Render component
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition"
          >
            Clear Route
          </button>
          <button
            onClick={toggleUnit}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
          >
            Toggle {unit === 'km' ? 'Miles' : 'Kilometers'}
          </button>
          <button
            onClick={toggleRouteType}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition"
          >
            {routeType === 'walking' ? 'Switch to Cycling' : 'Switch to Walking'}
          </button>
          {onRouteSave && (
            <button
              onClick={() => onRouteSave({ points, details: routeDetails })}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded transition"
            >
              Save Route
            </button>
          )}
        </div>
        {routeDetails && (
          <div className="px-4 py-2 bg-white rounded shadow">
            Distance: {formatDistance(routeDetails.distance)}
          </div>
        )}
      </div>
      <div 
        ref={mapContainer} 
        className="h-[600px] rounded-lg shadow-lg border" 
      />
    </div>
  );
};

export default MapComponent;