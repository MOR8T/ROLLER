import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // `admin` and `login` are excluded: they live outside `app/[locale]` and
  // are not part of the localized site, so this middleware must not try to
  // redirect them to a locale-prefixed path (e.g. `/admin` -> `/ru/admin`).
  matcher: "/((?!api|admin|login|_next|_vercel|.*\\..*).*)",
};
