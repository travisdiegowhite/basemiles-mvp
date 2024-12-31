// components/Map/MapComponent.tsx
import { useEffect, useRef, useState } from 'react';
import type mapboxgl from 'mapbox-gl';
import { FC } from 'react';

// We'll store the module differently to match Mapbox's typing
let mapboxglModule: typeof mapboxgl | undefined;

interface RoutePoint {
  coordinates: [number, number];
  id: string;
}

const MapComponent: FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Import the module properly
        const mapbox = await import('mapbox-gl');
        mapboxglModule = mapbox.default;

        // Set the access token using the correct method
        // In Mapbox GL JS, the access token is set on the Map constructor options
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        
        if (!accessToken) {
          throw new Error('Mapbox access token is required');
        }

        if (mapContainer.current && !map.current) {
          map.current = new mapboxglModule.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-95, 40],
            zoom: 4,
            accessToken // Pass the token here
          });

          // Add navigation controls if desired
          const nav = new mapboxglModule.NavigationControl();
          map.current.addControl(nav, 'top-right');

          map.current.on('load', () => {
            setMapLoaded(true);
            // Here we can add any additional map setup
          });

          // Add click handler for creating points
          map.current.on('click', (e) => {
            const newPoint: RoutePoint = {
              coordinates: [e.lngLat.lng, e.lngLat.lat],
              id: crypto.randomUUID()
            };
            setPoints(prev => [...prev, newPoint]);
          });
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setPoints([])}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition"
        >
          Clear Route
        </button>
        {distance > 0 && (
          <div className="px-4 py-2 bg-white rounded shadow">
            Distance: {(distance / 1000).toFixed(2)} km
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