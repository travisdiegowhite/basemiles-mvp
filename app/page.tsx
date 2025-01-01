// app/page.tsx
import { ClientMapWrapper } from '../components/Map/ClientMapWrapper';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <ClientMapWrapper />
    </main>
  );
}