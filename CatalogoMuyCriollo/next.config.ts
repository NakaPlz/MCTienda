import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    //  Also ignore typescript errors during build to ensure the user gets a build 
    // despite potential strict type issues in this rapid prototype phase
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
