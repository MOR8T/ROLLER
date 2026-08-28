/**
 * The fixed set of networks an admin can pick from when adding a social
 * link. Must list the exact same keys as the backend's `SocialNetwork`
 * Literal (`backend/app/schemas/social_link.py`) — that's the whole contract:
 * the backend only stores a key and a URL, and this file is what turns a key
 * into a brand icon and a label (`components/icons/social-icons.tsx`, the
 * admin `<select>` in `social-links-manager.tsx`).
 */
export const SOCIAL_NETWORKS = ["instagram", "telegram", "facebook", "youtube", "tiktok"] as const;

export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export function isSocialNetwork(value: string): value is SocialNetwork {
  return (SOCIAL_NETWORKS as readonly string[]).includes(value);
}
