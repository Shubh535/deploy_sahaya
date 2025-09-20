import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'firebase-admin',
      '@google-cloud/dlp',
    ],
  },
  // Only expose NEXT_PUBLIC_* on client; others stay server-side (default behavior)
  // Add any redirects/headers here if needed
};

export default nextConfig;
