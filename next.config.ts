import type {NextConfig} from 'next';

const repoName = 'vip';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  // IMPORTANT: Replace <your-repo-name> with the name of your GitHub repository.
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}`,
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
