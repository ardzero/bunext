import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // disable react compiler by default to make dev compile faster
  reactCompiler: false, // 'annotation' to make it opt in https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler#annotations
  // well-known root probes from scrapers / iOS when no <link> is read
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/favicons/favicon.ico" },
      { source: "/apple-touch-icon.png", destination: "/favicons/apple-touch-icon.png" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'v0.dev', pathname: '/placeholder.svg' },
    ],
  },
  compiler:
    process.env.NODE_ENV === "production" ? { removeConsole: true } : {},
  // Log full absolute URLs for fetch requests (dev/build) — useful for debugging API calls
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

// Vercel optimizes next/image on the platform. Keep the full server's Sharp
// trace for self-hosting and leave individual blur route traces untouched.
if (process.env.VERCEL === "1" && nextConfig.output !== "standalone") {
  nextConfig.outputFileTracingExcludes = {
    "next-server": [
      "./node_modules/sharp/**",
      "./node_modules/@img/sharp-*/**",
      "./node_modules/@img/colour/**",
    ],
  };
}

export default nextConfig;
