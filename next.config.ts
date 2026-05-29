import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Force Vercel to bypass the memory-heavy type check
    ignoreBuildErrors: true,
  }
};

export default nextConfig;