/**
 * The client-safe half of the product data layer.
 *
 * `lib/products.ts` is server-only — it imports all four message catalogues —
 * so the two things a *client* component legitimately needs from it live here
 * instead: the shape of the header menu, and the one function that builds a
 * product URL. `lib/products.ts` re-exports both, so server code has a single
 * import and nothing has to know about this split.
 */

export interface ProductsMenuCategory {
  id: number;
  name: string;
  products: { id: number; title: string }[];
}

/**
 * `/products/<category>/<product>` — the one place the product URL is built.
 *
 * Both segments are database ids. A product is listed in several categories
 * and therefore has several URLs; the category passed here is *the list the
 * visitor was looking at*, not a property of the product, so the page they
 * open keeps the context they came from.
 */
export function productHref(categoryId: number, productId: number): string {
  return `/products/${categoryId}/${productId}`;
}

/** `/products/<category>` — the category page. */
export function productCategoryHref(categoryId: number): string {
  return `/products/${categoryId}`;
}
