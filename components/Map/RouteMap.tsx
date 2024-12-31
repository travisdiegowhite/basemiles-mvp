// components/Map/RouteMap.tsx
'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(
  () => import('./MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] rounded-lg shadow-lg border flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading map...</div>
      </div>
    )
  }
);

export function RouteMap() {
  return <DynamicMap />;
}