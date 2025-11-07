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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/aviso',
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
