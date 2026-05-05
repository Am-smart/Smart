import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Re-enabled for production readiness verification
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Re-enabled for production readiness verification
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/v1/auth/:path*',
      },
      {
        source: '/api/learning/:path*',
        destination: '/api/v1/learning/:path*',
      },
      {
        source: '/api/assessment/:path*',
        destination: '/api/v1/assessment/:path*',
      },
      {
        source: '/api/system/:path*',
        destination: '/api/v1/system/:path*',
      },
    ];
  },
};

export default nextConfig;
