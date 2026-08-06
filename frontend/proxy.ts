import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

/**
 * Locale detection and redirect.
 *
 * ⚠️ Next.js 16 renamed `middleware` to `proxy`. The file must live at the
 * project root next to `app/`, and export the handler as `default` or as a
 * function named `proxy` — see `node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/proxy.md`.
 *
 * `createMiddleware` handles what the plan asks for: `/` negotiates against
 * `Accept-Language` (falling back to `ru`) and redirects to `/<locale>`, and
 * any unprefixed path gains the visitor's locale prefix.
 */
export default createMiddleware(routing);

export const config = {
  // Everything except Next internals, Vercel internals and files with an
  // extension (`/favicon.ico`, `/logos/logo-dark.png`, …). Without the
  // extension exclusion the proxy would try to redirect `public/` assets.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
