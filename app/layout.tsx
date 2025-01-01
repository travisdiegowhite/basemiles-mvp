// File: app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'BaseMiles',
  description: 'Plan your cycling routes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}