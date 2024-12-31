// File: next.config.ts
// Purpose: Configuration file for Next.js with security and optimization settings

const nextConfig = {
  // Security headers configuration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Base security policy - restrict resources to same origin by default
              "default-src 'self'",
              
              // Allow scripts from trusted sources and necessary inline scripts
              // unsafe-inline is needed for Next.js functionality
              // unsafe-eval is needed for Mapbox GL JS
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' api.mapbox.com",
              
              // Allow styles from Mapbox and inline styles needed for the map
              "style-src 'self' 'unsafe-inline' api.mapbox.com",
              
              // Allow images from Mapbox and data URIs for markers
              "img-src 'self' data: blob: api.mapbox.com",
              
              // Allow connections to Mapbox APIs for map tiles and directions
              "connect-src 'self' api.mapbox.com events.mapbox.com",
              
              // Allow web workers for map rendering performance
              "worker-src 'self' blob:",
              
              // Security settings for frame embedding
              "frame-ancestors 'self'",
              
              // Allow manifest files for PWA support
              "manifest-src 'self'",
              
              // Allow fonts from Mapbox
              "font-src 'self' api.mapbox.com",
            ].join('; ')
          }
        ]
      }
    ];
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Use SWC for minification (faster than Terser)
  swcMinify: true,
};

export default nextConfig;