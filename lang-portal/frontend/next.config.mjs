import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

async function getUserConfig() {
  try {
    return await import('./v0-user-next.config');
  } catch (e) {
    return undefined; // Ignore error
  }
}

const userConfig = await getUserConfig();

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
    viewTransition: true,
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

// Conditionally add rewrites only in development mode
if (process.env.NODE_ENV === 'development') {
  nextConfig.rewrites = async () => [
    { source: '/api/quiz-gen/:path*', destination: 'http://localhost:8004/api/quiz-gen/:path*' },
    { source: '/api/agent/:path*', destination: 'http://localhost:8002/api/agent:path*' },
    { source: '/api/vocab-importer/:path*', destination: 'http://localhost:8000/api/vocab-importer/:path*' },
    { source: '/api/writing/:path*', destination: 'http://localhost:8001/api/writing/:path*' },
    { source: '/api/langportal/:path*', destination: 'http://localhost:8080/api/langportal/:path*' },
  ];
}

// PostHog rewrites
const posthogRewrites = [
  { source: '/ingest/static/:path*', destination: 'https://eu-assets.i.posthog.com/static/:path*' },
  { source: '/ingest/:path*', destination: 'https://eu.i.posthog.com/:path*' },
  { source: '/ingest/decide', destination: 'https://eu.i.posthog.com/decide' },
];

if (nextConfig.rewrites) {
  const originalRewrites = nextConfig.rewrites;
  nextConfig.rewrites = async () => {
    const existing = await originalRewrites();
    return [...existing, ...posthogRewrites];
  };
} else {
  nextConfig.rewrites = async () => posthogRewrites;
}

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return nextConfig;
  }

  const mergedConfig = { ...nextConfig };

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      mergedConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      mergedConfig[key] = userConfig[key];
    }
  }

  return mergedConfig;
}

export default mergeConfig(nextConfig, userConfig);
