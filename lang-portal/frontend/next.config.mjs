import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

let userConfig = undefined;
try {
  userConfig = await import('./v0-user-next.config');
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

// Conditionally add rewrites only in development mode
if (process.env.NEXT_PHASE === PHASE_DEVELOPMENT_SERVER) {
  nextConfig.rewrites = async () => [
    { source: '/api/user/:path*', destination: 'http://localhost:3001/:path*' },
    { source: '/api/auth/:path*', destination: 'http://localhost:3002/:path*' },
    { source: '/api/vocab-import/:path*', destination: 'http://localhost:3002/:path*' },
    { source: '/api/langportal/:path*', destination: 'http://127.0.0.1:8080/api/langportal/:path*' },
  ];
}

mergeConfig(nextConfig, userConfig);

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return;
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

export default nextConfig;
