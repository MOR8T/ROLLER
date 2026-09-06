import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The page numbers under the news grid.
 *
 * imzo.uz puts a plain right-aligned row of numbers there — no arrows, no
 * "показать ещё" — and that is what this is. Two reasons it stayed that way
 * rather than becoming a "load more" button: the list is the one page on the
 * site a visitor scans by date, and a numbered page has a URL, which a button
 * does not.
 *
 * The squares are `rounded-control`, not the pills the homepage uses: `/news`
 * is an inner page and follows the site's shape language, not the homepage's.
 *
 * Server component — the page number is a `?page=` search param read by the
 * page above, so nothing here needs state.
 */
export function NewsPagination({ page, pageCount }: { page: number; pageCount: number }) {
  const t = useTranslations("newsPage.pagination");

  if (pageCount <= 1) return null;

  const cell =
    "inline-flex size-10 items-center justify-center rounded-control border text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none";

  return (
    <nav aria-label={t("label")} className="mt-10 flex justify-end lg:mt-12">
      <ol className="flex flex-wrap items-center gap-2">
        {pageNumbers(page, pageCount).map((entry, index) =>
          entry === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-sm font-semibold text-brand-black/35"
            >
              …
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={{ pathname: "/news", query: entry === 1 ? {} : { page: entry } }}
                aria-current={entry === page ? "page" : undefined}
                aria-label={t("page", { page: entry })}
                className={cn(
                  cell,
                  entry === page
                    ? "border-brand-black bg-brand-black text-brand-white"
                    : "border-brand-black/15 text-brand-black hover:border-brand-black/40 active:border-brand-black/40",
                )}
              >
                {entry}
              </Link>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}

/**
 * First page, last page, the current one and its neighbours; everything else
 * collapses into a gap. With fifteen mock articles this never truncates — it is
 * here because the admin panel will not stop at fifteen.
 */
function pageNumbers(page: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const window = new Set([1, pageCount, page, page - 1, page + 1]);
  const pages = [...window]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);

  return pages.flatMap((value, index) => {
    const previous = pages[index - 1];
    return previous !== undefined && value - previous > 1
      ? (["gap", value] as Array<number | "gap">)
      : [value];
  });
}
