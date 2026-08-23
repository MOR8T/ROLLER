import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // Default is 1 MB. Hero slide photos go through Server Actions
      // (`createHeroSlideAction`/`updateHeroSlideAction`) as multipart
      // FormData, and the backend itself allows up to 10 MB — this just
      // needs to clear that plus multipart's own boundary/header overhead.
      bodySizeLimit: "12mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Admin-uploaded hero slide photos, served from the backend's
    // `/uploads` mount — see `lib/hero-slides.ts`.
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "backend", port: "8000", pathname: "/uploads/**" },
    ],
  },
};

export default withNextIntl(nextConfig);
