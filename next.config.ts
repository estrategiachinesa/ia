
import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: 'export',
  // basePath and assetPrefix are not needed when deploying to the root of a repo
  // basePath: isProd ? '/wm' : undefined,
  // assetPrefix: isProd ? '/wm/' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
