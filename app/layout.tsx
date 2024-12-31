// File: /app/layout.tsx
import './globals.css';
import { headers } from 'next/headers';
import AuthHeader from '@/components/AuthHeader';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <header className="w-full border-b bg-white">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold">BaseMiles</h1>
            <AuthHeader />
          </div>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}