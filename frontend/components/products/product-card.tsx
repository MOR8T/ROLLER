import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { MediaFrame } from "@/components/ui/media-frame";
import { Link } from "@/i18n/navigation";
import { productHref, type ProductCardDto } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * A product in a list: the photo, the title and the description the admin
 * filled in when creating it. Nothing else.
 *
 * ⚠️ This card used to carry a brand logo, a segment badge, a material line and
 * the first three spec rows, all read from `data/products.ts` and the message
 * catalogue. It lost every one of them when products moved to the backend: the
 * client's flow is «фотография, заголовок и описание — эти данные будут
 * отображаться при отображении продукции в виде карточки», and a card that
 * shows fields the create form never asks for is a card that renders blanks.
 * The specs live on the product page, where the admin puts them in a section.
 *
 * `image` is nullable and `MediaFrame` draws its neutral placeholder instead —
 * ЭКОЛАЙН has no render at all, and a product with no photograph yet is a
 * normal state between creating it and uploading one.
 *
 * One addition from 2026-09-02, and it is chrome rather than content — no new
 * field is read from the backend: the hairline above the title fills brand red
 * on hover. It replaced the card's flat `border-t`, and it is the only red on
 * the page besides the header mark.
 *
 * ⚠️ That pass also numbered the cards («01», «02» …) and floated the renders
 * `object-contain` on a grey plate. The numbering was dropped at the client's
 * request, and the photographs are `object-cover` now — cropped and filling
 * the frame, the way the news covers and the homepage strip already are.
 */
export function ProductCard({
  product,
  categoryId,
  featured = false,
  sizes,
}: {
  product: ProductCardDto;
  /**
   * The category whose list this card sits in. It becomes the category segment
   * of the product URL, so a visitor who opened «Двери» stays in «Двери».
   */
  categoryId: number;
  /**
   * The photo-beside-text layout, for a category holding a single product.
   * A lone card in a three-column grid reads as a page that failed to finish
   * loading — see the grid's comment in the category page.
   */
  featured?: boolean;
  sizes?: string;
}) {
  const t = useTranslations("products");
  const href = productHref(categoryId, product.id);

  return (
    <article
      className={cn(
        "group h-full overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40",
        featured ? "flex flex-col lg:grid lg:grid-cols-2 lg:items-stretch" : "flex flex-col",
      )}
    >
      <Link
        href={href}
        aria-label={product.title}
        className={cn(
          "relative block bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
          featured && "lg:h-full",
        )}
      >
        <MediaFrame
          src={product.image}
          alt={product.title}
          // Not the title: it is repeated as the heading directly below, and
          // «ЭКОЛАЙН / ЭКОЛАЙН» reads as a rendering bug rather than as a
          // missing photograph.
          placeholderLabel={t("photoPending")}
          width={480}
          height={320}
          objectFit="cover"
          sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          // `fill` on the featured card so the photo matches the height of the
          // column beside it instead of setting its own aspect ratio.
          fill={featured}
          containerClassName={cn(
            "rounded-none border-0 bg-transparent",
            // The featured photo column sets a height of its own rather than
            // matching the text beside it: three lines of description alone
            // made a 290px band, which is a letterbox rather than a photograph.
            featured && "min-h-72 lg:min-h-[24rem]",
          )}
          className="transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </Link>

      <div
        className={cn("flex flex-1 flex-col p-6", featured && "justify-center p-6 sm:p-8 lg:p-10")}
      >
        {/* The card's divider, and its one moving part. `origin-left` +
            `scale-x`, not a width transition: a transform is composited and a
            width is not, and this runs on every card in a hovered grid. */}
        <span aria-hidden className="relative block h-px w-full bg-brand-black/10">
          <span className="absolute inset-0 origin-left scale-x-0 bg-brand-red transition-transform duration-500 ease-out group-hover:scale-x-100" />
        </span>

        <h3
          className={cn(
            "mt-5 font-heading font-semibold text-brand-black",
            featured ? "text-2xl sm:text-3xl" : "text-xl",
          )}
        >
          {product.title}
        </h3>

        <p
          className={cn(
            "mt-3 text-brand-black/70",
            featured ? "text-base leading-7" : "flex-1 text-sm leading-6",
          )}
        >
          {product.description}
        </p>

        <Link
          href={href}
          className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t("more")}
          <ArrowUpRight className="size-4 shrink-0" />
        </Link>
      </div>
    </article>
  );
}
