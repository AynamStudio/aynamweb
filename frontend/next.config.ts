import type { NextConfig } from "next";

const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL || "https://images.aynam.in";
const assetsHost = (() => {
  try {
    return new URL(assetsUrl).hostname;
  } catch {
    return "images.aynam.in";
  }
})();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 768, 1024, 1280, 1600, 2000],
    // Allow optimising assets served from the dedicated images/CDN subdomain
    // (e.g. images.aynam.in — also matches crm.images.aynam.in via wildcard).
    remotePatterns: [
      { protocol: "https", hostname: assetsHost },
      { protocol: "https", hostname: "*.aynam.in" },
    ],
  },
  // Keep the SMTP route handler server-only; never bundle nodemailer into
  // the client build.
  serverExternalPackages: ["nodemailer"],
  async headers() {
    return [
      {
        // Long-cache immutable fonts/textures; the banner used in emails is
        // served from public/images and needs a sensible cache + CORS so it
        // loads from images.aynam.in without issues.
        source: "/:path*.(jpg|jpeg|png|webp|avif|gif|svg|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
