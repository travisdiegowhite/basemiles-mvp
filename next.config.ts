// next.config.ts
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' api.mapbox.com",
              "style-src 'self' 'unsafe-inline' api.mapbox.com",
              "img-src 'self' data: blob: api.mapbox.com",
              "connect-src 'self' api.mapbox.com events.mapbox.com",
              "worker-src 'self' blob:",
            ].join('; ')
          }
        ]
      }
    ]
  },
  webpack: (config) => {
    // This is important for Mapbox GL JS
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false
    }
    return config
  }
}

export default nextConfig