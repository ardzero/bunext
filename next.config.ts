import type { NextConfig } from "next";

const isBunextDemo = process.env.VERCEL_PROJECT_ID === "prj_X6pJz4g5Mq8SoKnXnTg6oY2cAIHO";
const sharpBinaries = [
  "./node_modules/@img/sharp-*/lib/*.node",
  "./node_modules/@img/sharp-libvips-*/lib/libvips-cpp.*",
];

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
  // The docs page traces its OG module but never renders the PNG itself.
  // Route matches are partial, so Turbopack needs an explicit include for the OG child.
  outputFileTracingExcludes: isBunextDemo ? { "/docs": sharpBinaries } : undefined,
  outputFileTracingIncludes: isBunextDemo ? { "/docs/opengraph-image*": sharpBinaries } : undefined,
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

export default nextConfig;
