import { BACKEND_API_URL } from "@/lib/admin-auth";
import { isSocialNetwork, type SocialNetwork } from "@/lib/social-networks";

/**
 * Server-only read path for the footer's social-icons column, same shape as
 * `lib/contact-info.ts`: a tagged `fetch` against the backend, `null` on any
 * failure rather than a fabricated fallback. Managed from the admin panel
 * (`app/admin/(dashboard)/contacts/page.tsx`).
 */

interface RawSocialLink {
  id: number;
  network: string;
  url: string;
  enabled: boolean;
  position: number;
}

export interface SocialLinkDto {
  network: SocialNetwork;
  url: string;
}

/**
 * Returns `null` — never a fabricated placeholder — if the backend is
 * unreachable, too slow, or has nothing seeded yet. `Footer` renders a
 * skeleton in that case instead of guessing at which icons to show.
 *
 * A network key the frontend doesn't recognize (added on the backend before
 * this file's `SOCIAL_NETWORKS` list was updated to match) is dropped rather
 * than crashing the footer.
 *
 * `signal: AbortSignal.timeout(...)` matters here for the same reason as in
 * `getContactInfo`: `Footer` renders on every page, so a hung backend must
 * fail fast rather than stall every page load.
 */
export async function getSocialLinks(): Promise<SocialLinkDto[] | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/social-links`, {
      next: { revalidate: 60, tags: ["social-links"] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const raw = (await res.json()) as RawSocialLink[];
    return raw
      .filter((link) => link.enabled && link.url && isSocialNetwork(link.network))
      .sort((a, b) => a.position - b.position)
      .map((link) => ({ network: link.network as SocialNetwork, url: link.url }));
  } catch {
    return null;
  }
}
