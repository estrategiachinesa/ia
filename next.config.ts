
import type {NextConfig} from 'next';

const repoName = 'vip';

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export', // Removido para suportar Server Actions e Firebase App Hosting
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // unoptimized: true, // Removido, não é mais necessário para deploy em servidor
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Anotação para novo push
};

export default nextConfig;

