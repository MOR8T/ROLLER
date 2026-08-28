import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { MediaFrame } from "@/components/ui/media-frame";
import { Link } from "@/i18n/navigation";
import { productHref, type ProductCardDto } from "@/lib/products";

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
 */
export function ProductCard({
  product,
  categoryId,
  sizes,
}: {
  product: ProductCardDto;
  /**
   * The category whose list this card sits in. It becomes the category segment
   * of the product URL, so a visitor who opened «Двери» stays in «Двери».
   */
  categoryId: number;
  sizes?: string;
}) {
  const t = useTranslations("products");
  const href = productHref(categoryId, product.id);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40">
      <Link
        href={href}
        aria-label={product.title}
        className="relative block bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <MediaFrame
          src={product.image}
          alt={product.title}
          // Not the title: it is repeated as the heading directly below, and
          // «ЭКОЛАЙН / ЭКОЛАЙН» reads as a rendering bug rather than as a
          // missing photograph.
          placeholderLabel="Фото готовится"
          width={480}
          height={320}
          objectFit="contain"
          sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          containerClassName="rounded-none border-0 bg-transparent"
          // Admin-uploaded photos are absolute URLs into the backend, which
          // the server-side optimizer cannot reach from inside a container;
          // seeded `/public` paths keep the optimizer.
          unoptimized={product.image?.startsWith("http") ?? false}
          className="transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col border-t border-brand-black/8 p-6">
        <h3 className="font-heading text-xl font-semibold text-brand-black">{product.title}</h3>

        <p className="mt-3 flex-1 text-sm leading-6 text-brand-black/70">{product.description}</p>

        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t("more")}
          <ArrowUpRight className="size-4 shrink-0" />
        </Link>
      </div>
    </article>
  );
}
