import type {NextConfig} from 'next';

const repoName = 'traderchines';

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
};

export default nextConfig;
