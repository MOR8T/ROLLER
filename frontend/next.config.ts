import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Where the FastAPI service answers, from *inside* this container — Docker's
 * internal DNS under Compose (`http://backend:8000`), the same host in a plain
 * local run. `lib/admin-auth.ts` exports the same value for API calls; it is
 * repeated here because `next.config.ts` is loaded before the app's own
 * module graph and cannot import from it.
 *
 * ⚠️ That's true for the app's own server-side code, which reads
 * `process.env.BACKEND_API_URL` per request. It is NOT true for the
 * `rewrites()` below: `next build` calls it once and bakes the result into
 * `.next/routes-manifest.json`, and the standalone server serves rewrites
 * from that manifest at runtime rather than calling `rewrites()` again — so
 * for that one use, this is effectively build-time-only. The Dockerfile sets
 * a `BACKEND_API_URL` build ARG (default `http://backend:8000`) for exactly
 * this reason; without it the fallback below gets baked into every image
 * regardless of where it actually runs.
 */
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";

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
  /**
   * Admin uploads are served under this app's own origin.
   *
   * ⚠️ This is what lets `next/image` optimise them, and the reason every
   * `resolveImageSrc` in `lib/` hands out a bare `/uploads/...` path rather
   * than an absolute backend URL. The history is worth keeping:
   *
   * The paths used to be absolutised with `BACKEND_PUBLIC_URL` — a *browser*
   * address, `http://localhost:8000` under Compose. `next/image`'s optimizer
   * runs server-side, so it tried that same address from inside the frontend
   * container, where it resolves to the container's own loopback. Next 16
   * refuses to optimise a remote image whose host resolves to a private or
   * loopback IP (`images.dangerouslyAllowLocalIP`, off by default), so every
   * admin-uploaded photo came back `400 "url" parameter is not allowed` and
   * simply did not render. The workaround at the time was `unoptimized` at each
   * call site, which fixed the blank images and shipped 4000×6000 originals to
   * phones.
   *
   * With the rewrite the optimizer sees a local path, fetches it through this
   * app using Docker's internal hostname, and resizes it like any other image.
   * `images.remotePatterns` is deliberately absent: nothing hands `next/image`
   * an absolute URL any more, and re-adding one would bring the whole problem
   * back.
   *
   * Production is unaffected — `nginx/conf.d/app-locations.inc` answers
   * `/uploads/` from the backend volume directly, so a browser request never
   * reaches this rewrite. Only the optimizer's own server-side fetch does.
   */
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: `${BACKEND_API_URL}/uploads/:path*` }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default withNextIntl(nextConfig);
