import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/analisador',
        destination: '/sinais',
        permanent: true,
      },
      {
        source: '/estrategiachinesa',
        destination: '/sinais',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
