'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Coordinate = [number, number];

const initializeLeafletIcons = () => {
  if ((L.Icon.Default.prototype as any)._getIconUrl) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
  }
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png'
  });
};

const DEFAULT_CENTER: Coordinate = [37.7749, -122.4194];
const DEFAULT_ZOOM = 13;

const LeafletMapComponent = () => {
  const [waypoints, setWaypoints] = useState<Coordinate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    console.log('Initializing map...');
    initializeLeafletIcons();

    if (!mapRef.current) {
      const map = L.map('map').setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      
      L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
        {
          attribution: '© Mapbox © OpenStreetMap',
          maxZoom: 18,
          tileSize: 512,
          zoomOffset: -1,
        }
      ).addTo(map);

      map.on('click', handleMapClick);
      mapRef.current = map;
      console.log('Map initialized successfully');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle map clicks
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    console.log('Map clicked:', e.latlng);
    if (!mapRef.current) return;

    const { lat, lng } = e.latlng;
    const newPoint: Coordinate = [lat, lng];
    
    // Add marker
    const marker = L.marker([lat, lng]).addTo(mapRef.current);
    markersRef.current.push(marker);

    setWaypoints(prev => {
      const newWaypoints = [...prev, newPoint];
      console.log('Updated waypoints:', newWaypoints);
      
      if (newWaypoints.length >= 2) {
        console.log('Two or more waypoints - fetching route...');
        fetchRoute(newWaypoints);
      }
      
      return newWaypoints;
    });
  }, []);

  const fetchRoute = async (points: Coordinate[]) => {
    console.log('Fetching route for points:', points);
    if (points.length < 2) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Convert to Mapbox format (lng,lat)
      const coordinates = points
        .map(([lat, lng]) => `${lng},${lat}`)
        .join(';');

      console.log('Coordinates string:', coordinates);

      const url = `https://api.mapbox.com/directions/v5/mapbox/cycling/${coordinates}`;
      const params = new URLSearchParams({
        geometries: 'geojson',
        access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
        steps: 'true',
        overview: 'full'
      }).toString();

      console.log('Fetching from URL:', `${url}?${params}`);

      const response = await fetch(`${url}?${params}`);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();
      console.log('Route data received:', data);

      if (!data.routes?.[0]?.geometry?.coordinates) {
        throw new Error('No route found');
      }

      // Draw the route
      drawRoute(data.routes[0].geometry.coordinates);

    } catch (err) {
      console.error('Error fetching route:', err);
      setError(err instanceof Error ? err.message : 'Error fetching route');
    } finally {
      setIsLoading(false);
    }
  };

  const drawRoute = useCallback((coordinates: number[][]) => {
    console.log('Drawing route with coordinates:', coordinates);
    if (!mapRef.current) return;

    // Clear existing route
    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Convert coordinates from [lng, lat] to [lat, lng]
    const leafletCoords = coordinates.map(([lng, lat]) => [lat, lng] as Coordinate);
    console.log('Converted coordinates:', leafletCoords);

    // Create new route layer
    routeLayerRef.current = L.polyline(leafletCoords, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.8
    }).addTo(mapRef.current);

    // Fit bounds
    mapRef.current.fitBounds(routeLayerRef.current.getBounds(), {
      padding: [50, 50],
      maxZoom: 16
    });

    console.log('Route drawn successfully');
  }, []);

  const resetMap = useCallback(() => {
    console.log('Resetting map...');
    if (!mapRef.current) return;

    // Clear markers
    markersRef.current.forEach(marker => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // Clear route
    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Reset state
    setWaypoints([]);
    setError(null);

    // Reset view
    mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    console.log('Map reset complete');
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full relative">
          <div id="map" className="h-full w-full" />
          
          {isLoading && (
            <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded shadow">
              Loading route...
            </div>
          )}

          {error && (
            <div className="absolute top-4 right-4 bg-red-100 text-red-700 px-4 py-2 rounded shadow">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 p-4 bg-white shadow-lg">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Route Planner</h3>
            <p className="text-gray-600 mb-4">
              Click on the map to add waypoints. A route will be created automatically when you add two or more points.
            </p>
            <button
              onClick={resetMap}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Reset Route
            </button>
          </div>
          
          {waypoints.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Waypoints</h4>
              <ul className="space-y-2">
                {waypoints.map((point, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    Point {index + 1}: {point[0].toFixed(4)}, {point[1].toFixed(4)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeafletMapComponent;