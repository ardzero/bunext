import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

// Sent on every response. No full Content-Security-Policy yet (it needs nonces
// for inline scripts); `frame-ancestors` alone stops clickjacking.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // HTTPS only; localhost stays on http in development
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000",
        },
      ]
    : []),
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
  // don't advertise the framework
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // keep the dev indicator clear of the header's account menu (top right)
  devIndicators: { position: "bottom-right" },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'v0.dev', pathname: '/placeholder.svg' },
    ],
  },
  compiler: isProduction
    ? { removeConsole: { exclude: ["error", "warn"] } }
    : {},
  // Log full absolute URLs for fetch requests (dev/build) — useful for debugging API calls
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
