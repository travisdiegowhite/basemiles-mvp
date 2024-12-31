// File: /app/page.tsx
import { RouteMap } from '@/components/Map/RouteMap';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <RouteMap />
      </div>
    </div>
  );
}