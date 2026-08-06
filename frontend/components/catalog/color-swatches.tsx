import { useTranslations } from "next-intl";

import { colorSwatches } from "@/data/catalog";

/**
 * The lamination palette a system is sold in.
 *
 * Deliberately not the gallery's colour switcher, and deliberately fed from
 * `product.colors` rather than from `product.gallery`. The two lists answer
 * different questions — "what can I order?" and "what can I look at?" — and
 * they are not the same list: ЭКОЛАЙН ships in white and has no render at all,
 * so a swatch row derived from the pictures would tell a visitor the system has
 * no colours.
 *
 * Swatches are static squares, not buttons. Nothing happens when you press a
 * colour here; the interactive one lives in `ProductGallery`, and two controls
 * that look alike and behave differently is worse than one control and one
 * legend.
 */
export function ColorSwatches({ colors }: { colors: string[] }) {
  const t = useTranslations("colors");

  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-4">
      {colors.map((color) => (
        <li key={color} className="flex items-center gap-3">
          <span
            aria-hidden
            className="size-9 shrink-0 rounded-control border border-brand-black/15"
            style={{ backgroundColor: colorSwatches[color] }}
          />
          <span className="text-sm font-medium text-brand-black">{t(color)}</span>
        </li>
      ))}
    </ul>
  );
}
