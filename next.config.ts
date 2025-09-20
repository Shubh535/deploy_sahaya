import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Packages that must remain external in server runtime (e.g., native bindings or big SDKs)
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/dlp',
  ],
  // Do not block production builds on ESLint rule violations
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep TypeScript build errors enabled; set to true if you prefer to skip
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
