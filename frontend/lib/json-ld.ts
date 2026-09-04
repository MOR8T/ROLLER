import "server-only";

import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/lib/site-config";
import { getContactInfo } from "@/lib/contact-info";
import { getSocialLinks } from "@/lib/social-links";
import { seoConfig } from "@/lib/seo-config";
import { absoluteUrl, localizedPath, siteUrl } from "@/lib/seo";

/**
 * The structured data (`application/ld+json`) the site publishes about itself.
 *
 * Assembled from data that already exists rather than from a second copy of
 * it: the phone, email and per-locale address come from `ContactInfo`, the
 * social profiles from `SocialLink`, the founding year from `siteConfig`, and
 * the facts with nowhere else to live — legal name, coordinates, opening hours,
 * postal code — from `lib/seo-config.ts`. That is why these builders are `async`
 * and read several sources: the alternative is a JSON-LD block that says one
 * address while the page shows another, which is worse than no markup at all.
 *
 * ⚠️ **No prices, anywhere.** The product graph carries no `offers`, no
 * `priceRange`, no `aggregateRating`. Not an oversight — the calculator is
 * explicitly not a price calculator (`CLAUDE.md`), the site publishes no
 * prices, and a `Product` with a fabricated `offers` block is exactly the kind
 * of markup that earns a structured-data penalty. It also means Google will
 * not render a rich product result for these pages; that is the correct
 * outcome for a manufacturer's catalogue with no e-commerce.
 *
 * Every builder returns `null` when it has nothing worth saying, and the
 * callers render nothing in that case — an empty `Organization` with only a
 * name is markup for its own sake.
 */

/** Anything JSON-serialisable; the shape is schema.org's, not ours to type. */
export type JsonLdNode = Record<string, unknown>;

/**
 * `Organization` + `LocalBusiness` for the site as a whole, emitted once from
 * the root layout.
 *
 * Modelled as a single `LocalBusiness` node rather than two: `LocalBusiness` is
 * a subtype of `Organization`, so one node satisfies both readings, and two
 * nodes with the same `@id` is the most common way this markup goes wrong.
 * `@id` is the site origin plus `#organization`, so the product and article
 * graphs can point at this node instead of restating the publisher.
 */
export async function buildOrganizationJsonLd(locale: string): Promise<JsonLdNode | null> {
  const [contacts, socialLinks] = await Promise.all([getContactInfo(locale), getSocialLinks()]);

  const org = seoConfig.organization;
  const sameAs = (socialLinks ?? []).map((link) => link.url);
  const phone = contacts?.phone ?? siteConfig.phone;
  const email = contacts?.email ?? siteConfig.email;

  // The postal address is only worth emitting when it has a street in it.
  // `countryCode` is the one field that ships pre-filled, and a PostalAddress
  // carrying nothing but a country tells a crawler less than no address does.
  const address = org.streetAddress
    ? {
        "@type": "PostalAddress",
        streetAddress: org.streetAddress,
        ...(org.locality ? { addressLocality: org.locality } : {}),
        ...(org.postalCode ? { postalCode: org.postalCode } : {}),
        addressCountry: org.countryCode,
      }
    : undefined;

  const geo =
    org.latitude && org.longitude
      ? { "@type": "GeoCoordinates", latitude: org.latitude, longitude: org.longitude }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}#organization`,
    name: siteConfig.name,
    ...(org.legalName ? { legalName: org.legalName } : {}),
    url: absoluteUrl(localizedPath(locale, "")),
    ...(seoConfig.ogImage ? { image: absoluteUrl(seoConfig.ogImage) } : {}),
    logo: absoluteUrl("/logos/logo_dark.svg"),
    telephone: phone,
    email,
    ...(address ? { address } : {}),
    ...(geo ? { geo } : {}),
    ...(org.openingHours ? { openingHours: org.openingHours } : {}),
    foundingDate: String(siteConfig.foundedYear),
    ...(contacts?.mapUrl ? { hasMap: contacts.mapUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    // The four locales the business answers in. Tajik is `tg` here for the
    // reason `HREFLANG_BY_LOCALE` spells out — schema.org wants the language,
    // and the language is not the URL segment.
    availableLanguage: ["ru", "tg", "en", "tr"],
    areaServed: { "@type": "Country", name: "Tajikistan" },
  };
}

/**
 * The `WebSite` node — separate from the organisation because it describes the
 * *site*, and because Google reads `name` here for the sitelinks title.
 *
 * No `SearchAction`: there is no site search to point one at, and declaring a
 * search endpoint that 404s is worse than declaring none.
 */
export async function buildWebSiteJsonLd(locale: string): Promise<JsonLdNode> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    name: siteConfig.name,
    url: absoluteUrl(localizedPath(locale, "")),
    publisher: { "@id": `${siteUrl}#organization` },
    inLanguage: locale === "tj" ? "tg" : locale,
  };
}

/**
 * `BreadcrumbList` for a page that shows breadcrumbs.
 *
 * ⚠️ The trail passed in must match the crumbs the page actually renders. The
 * markup exists so a search result shows the same path a visitor sees; a
 * breadcrumb list that disagrees with the visible one is a mismatch Google
 * treats as spam rather than as a hint. That is also why the «Главная» crumb
 * is prepended *here* rather than by the caller — `components/products/
 * breadcrumbs.tsx` prepends it to the visible trail the same way, and a
 * caller that had to remember to add it to both would eventually add it to one.
 *
 * Takes the same `items` the `Breadcrumbs` component takes, so the two calls on
 * a page read identically and a change to one is visibly a change to the other.
 *
 * `item` is omitted on the last entry — the current page. Schema.org allows it,
 * and including a self-link is what makes the trail render with a trailing
 * clickable crumb that goes nowhere.
 */
export async function buildBreadcrumbJsonLd(
  locale: string,
  items: { name: string; path?: string }[],
): Promise<JsonLdNode | null> {
  if (items.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "breadcrumbs" });

  const trail = [{ name: t("home"), path: "" }, ...items];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.path !== undefined ? { item: absoluteUrl(localizedPath(locale, crumb.path)) } : {}),
    })),
  };
}

/** `Product` for one product page. See the no-prices note at the top of this file. */
export async function buildProductJsonLd({
  locale,
  path,
  name,
  description,
  image,
  category,
}: {
  locale: string;
  path: string;
  name: string;
  description: string;
  image?: string;
  category?: string;
}): Promise<JsonLdNode> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(description ? { description } : {}),
    ...(image ? { image: absoluteUrl(image) } : {}),
    ...(category ? { category } : {}),
    url: absoluteUrl(localizedPath(locale, path)),
    brand: { "@type": "Brand", name: siteConfig.name },
    manufacturer: { "@id": `${siteUrl}#organization` },
  };
}

/** `NewsArticle` for one article page. */
export async function buildArticleJsonLd({
  locale,
  path,
  headline,
  description,
  image,
  publishedAt,
}: {
  locale: string;
  path: string;
  headline: string;
  description: string;
  image?: string;
  publishedAt: string;
}): Promise<JsonLdNode> {
  const url = absoluteUrl(localizedPath(locale, path));

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline,
    ...(description ? { description } : {}),
    ...(image ? { image: [absoluteUrl(image)] } : {}),
    datePublished: publishedAt,
    // No `dateModified`: the backend does not track one for an article, and
    // repeating `datePublished` there would assert something untrue the first
    // time the client edits a post.
    author: { "@id": `${siteUrl}#organization` },
    publisher: { "@id": `${siteUrl}#organization` },
    inLanguage: locale === "tj" ? "tg" : locale,
  };
}
