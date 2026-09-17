import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
