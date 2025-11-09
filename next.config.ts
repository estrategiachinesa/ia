import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // IMPORTANT: The build will be configured for a root deployment.
  // If you are deploying to a subdirectory (e.g., your-gh-username.github.io/your-repo-name),
  // you will need to add `basePath: '/your-repo-name'` and `assetPrefix: '/your-repo-name/'`.
  basePath: '/i.a.',
  assetPrefix: '/i.a./',
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
