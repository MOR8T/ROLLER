import { BACKEND_API_URL } from "@/lib/admin-auth";

/**
 * Server-only read path for the site-wide switches an admin flips in
 * «Настройки сайта» — same shape as `lib/contact-info.ts`: a tagged `fetch`
 * against the backend, mapped to a DTO, with no throw on failure.
 *
 * Today there is exactly one switch, `maintenanceMode`, and
 * `app/[locale]/layout.tsx` is its only consumer.
 */

interface RawSiteSettings {
  maintenance_mode: boolean;
}

export interface SiteSettingsDto {
  /** True → the public site is replaced by `MaintenanceScreen`. */
  maintenanceMode: boolean;
}

/**
 * ⚠️ Fails **open**: an unreachable, slow or unseeded backend returns
 * `maintenanceMode: false`, i.e. the normal site.
 *
 * That is the opposite of `lib/contact-info.ts`'s "return null and let the
 * caller render a skeleton", and it is deliberate. This value gates the whole
 * public site, so the failure modes are not symmetric — a backend hiccup that
 * showed the placeholder would take the storefront down on its own, while one
 * that shows the real site costs nothing. The switch is an editorial decision
 * an admin makes, not a health check.
 *
 * `AbortSignal.timeout` matters for the same reason it does in
 * `lib/contact-info.ts`, only more so: this runs in the layout every page
 * passes through, so a hung backend must fail fast rather than stall the site.
 *
 * The 60s `revalidate` is a backstop only — `updateSiteSettingsAction`
 * revalidates the `site-settings` tag the moment the admin saves, so flipping
 * the switch takes effect immediately rather than up to a minute later.
 */
export async function getSiteSettings(): Promise<SiteSettingsDto> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/site-settings`, {
      next: { revalidate: 60, tags: ["site-settings"] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { maintenanceMode: false };

    const raw = (await res.json()) as RawSiteSettings;
    return { maintenanceMode: raw.maintenance_mode === true };
  } catch {
    return { maintenanceMode: false };
  }
}
