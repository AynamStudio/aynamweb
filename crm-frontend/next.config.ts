import type { NextConfig } from "next";

// Backend base URL. Read from API_URL env (server-only, NEVER prefixed with
// NEXT_PUBLIC_). Defaults to local dev backend. All /api/* requests from the
// browser hit this Next server and are rewritten to the backend, so the
// browser never sees the real API origin.
const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.aynam.in" },
      { protocol: "https", hostname: "aynam.in" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
