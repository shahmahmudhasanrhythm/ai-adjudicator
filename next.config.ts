import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors. This prevents Vercel memory crashes.
    ignoreBuildErrors: true,
  },
  eslint: {
    // This allows production builds to successfully complete even if
    // your project has ESLint warnings.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;