import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com',
      },
    ],
  },
  async rewrites() {
    console.log("---------------------------------------------------");
    console.log("DEBUG: Loading Next Config Rewrites");
    console.log("DEBUG: BACKEND_INTERNAL_URL =", process.env.BACKEND_INTERNAL_URL);
    console.log("---------------------------------------------------");

    // Forced logic for debugging
    const backendUrl = process.env.BACKEND_INTERNAL_URL || (process.env.NODE_ENV === 'production' ? 'http://backend:8000' : 'http://127.0.0.1:8000');

    console.log("DEBUG: Final Rewrite Destination:", backendUrl);

    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
};

export default nextConfig;
