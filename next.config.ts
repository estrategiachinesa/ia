import type {NextConfig} from 'next';

const repoName = 'vip';

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export', // Removido para compatibilidade com o Firebase App Hosting
  // basePath and assetPrefix are not needed when deploying to the root of a repo
  // basePath: isProd ? '/wm' : undefined,
  // assetPrefix: isProd ? '/wm/' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
