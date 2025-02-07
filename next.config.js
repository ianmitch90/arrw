/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'mapbox-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    }
  ]
});

const nextConfig = {
  experimental: {
    // Configure client-side router cache staleness
    staleTimes: {
      // 30 seconds for dynamic content
      dynamic: 30,
      // 3 minutes for static content
      static: 180
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

// Enable experimental features based on environment
// Server Actions are now stable in Next.js 15
if (process.env.NODE_ENV === 'development') {
  nextConfig.experimental = {};
}

module.exports = withPWA(nextConfig);
