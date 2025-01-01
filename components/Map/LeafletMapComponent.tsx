'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinate, RouteData, RouteStep, RoutePreferences } from '../../types/map';
import { formatDistance, formatDuration, cleanInstruction, getRouteParams } from '../../utils/routeUtils';
import { RoutePreferencesPanel } from './RoutePreferences';

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
const DEFAULT_PREFERENCES: RoutePreferences = {
  hills: 'none',
  type: 'balanced',
  surface: 'any'
};

const LeafletMapComponent = () => {
  // State
  const [waypoints, setWaypoints] = useState<Coordinate[]>([]);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [alternatives, setAlternatives] = useState<RouteData[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<RoutePreferences>(DEFAULT_PREFERENCES);
  const [activeStep, setActiveStep] = useState<RouteStep | null>(null);

  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const alternativeLayersRef = useRef<L.Polyline[]>([]);
  const markersRef = useRef<L.Marker[]>([]);
  const activeStepMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    initializeLeafletIcons();

    if (!mapRef.current && mapContainer.current) {
      const map = L.map(mapContainer.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      
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
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Clear all map layers
  const clearMapLayers = useCallback(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    alternativeLayersRef.current.forEach(layer => {
      layer.remove();
    });
    alternativeLayersRef.current = [];

    if (activeStepMarkerRef.current) {
      activeStepMarkerRef.current.remove();
      activeStepMarkerRef.current = null;
    }
  }, []);

  // Handle map clicks
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!mapRef.current) return;

    const { lat, lng } = e.latlng;
    const newPoint: Coordinate = [lat, lng];
    
    const marker = L.marker([lat, lng]).addTo(mapRef.current);
    markersRef.current.push(marker);

    setWaypoints(prev => {
      const newWaypoints = [...prev, newPoint];
      if (newWaypoints.length >= 2) {
        fetchRoute(newWaypoints);
      }
      return newWaypoints;
    });
  }, []);

  // Fetch route data
  const fetchRoute = async (points: Coordinate[]) => {
    if (points.length < 2) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const coordinates = points
        .map(([lat, lng]) => `${lng},${lat}`)
        .join(';');

      const params = getRouteParams(preferences);
      const url = `https://api.mapbox.com/directions/v5/mapbox/cycling/${coordinates}`;

      const response = await fetch(`${url}?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch route');
      }

      if (!data.routes?.length) {
        throw new Error('No route found');
      }

      const mainRoute = data.routes[0] as RouteData;
      const alternativeRoutes = data.routes.slice(1) as RouteData[];

      setRouteData(mainRoute);
      setAlternatives(alternativeRoutes);
      setSelectedRouteIndex(0);

      drawRoutes(mainRoute, alternativeRoutes);

    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'Error fetching route');
    } finally {
      setIsLoading(false);
    }
  };

  // Draw routes on the map
  const drawRoutes = useCallback((mainRoute: RouteData, alternatives: RouteData[]) => {
    if (!mapRef.current) return;

    clearMapLayers();

    // Draw alternative routes
    alternatives.forEach((route, index) => {
      const coords = route.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );

      const alternativeLayer = L.polyline(coords, {
        color: '#94a3b8',
        weight: 4,
        opacity: 0.5,
        dashArray: '5, 10'
      }).addTo(mapRef.current!);

      alternativeLayersRef.current.push(alternativeLayer);
    });

    // Draw main route
    const mainCoords = mainRoute.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );

    routeLayerRef.current = L.polyline(mainCoords, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.8
    }).addTo(mapRef.current);

    // Fit bounds to show all routes
    const allCoords = [mainCoords, ...alternatives.map(r => 
      r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
    )].flat();

    const bounds = L.latLngBounds(allCoords);
    mapRef.current.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 16
    });
  }, [clearMapLayers]);

  // Handle route selection
  const selectRoute = useCallback((index: number) => {
    if (!mapRef.current) return;

    const selectedRoute = index === 0 ? routeData : alternatives[index - 1];
    if (!selectedRoute) return;

    setSelectedRouteIndex(index);
    setRouteData(selectedRoute);

    if (routeLayerRef.current) {
      routeLayerRef.current.setStyle({ opacity: 0.8 });
    }

    alternativeLayersRef.current.forEach((layer, i) => {
      layer.setStyle({
        opacity: i === index - 1 ? 0.8 : 0.5
      });
    });
  }, [routeData, alternatives]);

  // Reset map
  const resetMap = useCallback(() => {
    clearMapLayers();
    setWaypoints([]);
    setRouteData(null);
    setAlternatives([]);
    setSelectedRouteIndex(0);
    setActiveStep(null);
    setError(null);

    if (mapRef.current) {
      mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [clearMapLayers]);

  // Update route when preferences change
  useEffect(() => {
    if (waypoints.length >= 2) {
      fetchRoute(waypoints);
    }
  }, [preferences, waypoints]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full relative">
          <div ref={mapContainer} className="h-full w-full" />
          
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

      <div className="w-96 p-4 bg-white shadow-lg overflow-auto">
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

          <RoutePreferencesPanel
            preferences={preferences}
            onChange={setPreferences}
          />

          {routeData && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Route Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="text-lg font-medium">
                    {formatDistance(routeData.distance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-lg font-medium">
                    {formatDuration(routeData.duration)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {alternatives.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Alternative Routes</h4>
              <div className="space-y-2">
                <button
                  onClick={() => selectRoute(0)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedRouteIndex === 0
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium">Main Route</p>
                  <p className="text-sm text-gray-600">
                    {formatDistance(routeData?.distance || 0)} • {formatDuration(routeData?.duration || 0)}
                  </p>
                </button>

                {alternatives.map((route, index) => (
                  <button
                    key={index}
                    onClick={() => selectRoute(index + 1)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRouteIndex === index + 1
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium">Alternative {index + 1}</p>
                    <p className="text-sm text-gray-600">
                      {formatDistance(route.distance)} • {formatDuration(route.duration)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeafletMapComponent;