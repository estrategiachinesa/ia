import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // IMPORTANT: The build will be configured for a root deployment.
  // If you are deploying to a subdirectory (e.g., your-gh-username.github.io/your-repo-name),
  // you will need to add `basePath: '/your-repo-name'` and `assetPrefix: '/your-repo-name/'`.
  basePath: '/traderchines',
  assetPrefix: '/traderchines/',
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
