'use client';

// File: components/Map/ClientMapWrapper.tsx
import dynamic from 'next/dynamic';

// Dynamically import LeafletMapComponent with no SSR
const LeafletMapComponent = dynamic(
  () => import('./LeafletMapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading map component...</div>
      </div>
    )
  }
);

export function ClientMapWrapper() {
  return <LeafletMapComponent />;
}