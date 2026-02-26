import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@lumen/shared'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3050'],
    },
  },
};

export default nextConfig;
