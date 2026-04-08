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
  }
};

export default nextConfig;
