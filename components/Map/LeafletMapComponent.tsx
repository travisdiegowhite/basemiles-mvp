'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinate, RouteData, RouteStep } from '../../types/map';
import { formatDistance, formatDuration, cleanInstruction } from '../../utils/routeUtils';
// 
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
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<RouteStep | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const activeStepMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
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
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

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

  const fetchRoute = async (points: Coordinate[]) => {
    if (points.length < 2) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const coordinates = points
        .map(([lat, lng]) => `${lng},${lat}`)
        .join(';');

      const params = new URLSearchParams({
        geometries: 'geojson',
        access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
        steps: 'true',
        overview: 'full',
        annotations: 'duration,distance'
      });

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/cycling/${coordinates}?${params}`
      );

      if (!response.ok) throw new Error('Failed to fetch route');

      const data = await response.json();
      if (!data.routes?.[0]) throw new Error('No route found');

      const routeData = data.routes[0] as RouteData;
      setRouteData(routeData);
      drawRoute(routeData.geometry.coordinates);

    } catch (err) {
      console.error('Error fetching route:', err);
      setError(err instanceof Error ? err.message : 'Error fetching route');
    } finally {
      setIsLoading(false);
    }
  };

  const drawRoute = useCallback((coordinates: [number, number][]) => {
    if (!mapRef.current) return;

    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    const leafletCoords = coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

    routeLayerRef.current = L.polyline(leafletCoords, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.8
    }).addTo(mapRef.current);

    const bounds = L.latLngBounds(leafletCoords);
    mapRef.current.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 16
    });
  }, []);

  const highlightStep = useCallback((step: RouteStep) => {
    if (!mapRef.current) return;

    if (activeStepMarkerRef.current) {
      mapRef.current.removeLayer(activeStepMarkerRef.current);
      activeStepMarkerRef.current = null;
    }

    const [lng, lat] = step.maneuver.location;
    const icon = L.divIcon({
      className: 'step-marker',
      html: '<div class="w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-lg"></div>'
    });

    activeStepMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(mapRef.current)
      .bindPopup(cleanInstruction(step.maneuver.instruction))
      .openPopup();

    mapRef.current.setView([lat, lng], 16);
    setActiveStep(step);
  }, []);

  const resetMap = useCallback(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (activeStepMarkerRef.current) {
      mapRef.current.removeLayer(activeStepMarkerRef.current);
      activeStepMarkerRef.current = null;
    }

    setWaypoints([]);
    setRouteData(null);
    setActiveStep(null);
    setError(null);

    mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
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

          {routeData && (
            <>
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

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Turn-by-turn Directions</h4>
                <div className="space-y-2">
                  {routeData.legs.flatMap((leg, legIndex) =>
                    leg.steps.map((step, stepIndex) => (
                      <button
                        key={`${legIndex}-${stepIndex}`}
                        onClick={() => highlightStep(step)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          activeStep === step
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <p className="text-sm">
                          {cleanInstruction(step.maneuver.instruction)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistance(step.distance)} • {formatDuration(step.duration)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeafletMapComponent;