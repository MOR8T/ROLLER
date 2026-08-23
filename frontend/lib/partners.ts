import { BACKEND_API_URL } from "@/lib/admin-auth";

/**
 * Server-only read path for `PartnersSection` (rendered on `/` and
 * `/about`). Partners are managed from the admin panel
 * (`app/admin/(dashboard)/about/page.tsx`) and stored in the backend as a
 * name plus a logo — no locale split, the name is a brand mark, not copy.
 *
 * An empty array means "no partners yet" — `PartnersSection` renders a
 * skeleton in that case instead of fabricated content.
 */
export interface PartnerDto {
  id: number;
  name: string;
  logo: string;
}

interface RawPartner {
  id: number;
  name: string;
  logo_path: string;
  position: number;
}

/** Only `BACKEND_API_URL` needs the Docker-internal hostname; the browser
 * loads images through this one instead. Same value everywhere except a
 * Docker Compose deployment, where they diverge — see `.env.example`. */
const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL ?? BACKEND_API_URL;

function resolveLogoSrc(logoPath: string): string {
  return logoPath.startsWith("/uploads/") ? `${BACKEND_PUBLIC_URL}${logoPath}` : logoPath;
}

/**
 * Reads the live partners from the backend. Returns an empty array — never
 * a fabricated placeholder — if the backend is unreachable or has no
 * partners yet; the caller is responsible for showing a loading/empty state.
 */
export async function getPartners(): Promise<PartnerDto[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/partners`, {
      next: { revalidate: 60, tags: ["partners"] },
    });
    if (!res.ok) return [];

    const data: RawPartner[] = await res.json();
    return data
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((raw) => ({
        id: raw.id,
        name: raw.name,
        logo: resolveLogoSrc(raw.logo_path),
      }));
  } catch {
    return [];
  }
}
