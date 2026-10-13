import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Prevent ESLint errors/warnings from failing Vercel production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ensures strict type validation
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
