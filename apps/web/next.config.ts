import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@lumen/shared'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3050'],
    },
  },
};

export default nextConfig;
