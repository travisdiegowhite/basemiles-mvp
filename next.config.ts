// next.config.ts
const nextConfig = {
  // Ensure images from Mapbox are allowed
  images: {
    domains: ['api.mapbox.com'],
  },
  // Add headers for Mapbox
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' api.mapbox.com",
              "style-src 'self' 'unsafe-inline' api.mapbox.com",
              "img-src 'self' data: blob: api.mapbox.com",
              "connect-src 'self' api.mapbox.com events.mapbox.com",
              "worker-src 'self' blob:",
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;