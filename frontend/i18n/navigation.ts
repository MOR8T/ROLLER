import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware wrappers around Next's navigation APIs. Every *internal* link
 * on the site must come from here rather than from `next/link`, otherwise it
 * drops the visitor back onto the default locale.
 *
 * External targets (`https://wa.me/…`, `tel:`, `mailto:`) and same-page
 * fragments (`#brands`) stay on plain `<a>` — there is no locale to add.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
