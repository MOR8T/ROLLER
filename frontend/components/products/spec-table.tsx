import type { Spec } from "@/types";

/**
 * The characteristics table.
 *
 * Built from `Spec` pairs and nothing else — no column is named in this file,
 * no row is expected. That is the whole requirement in
 * `project_plan/05-product-page.md` ("верстка не должна предполагать
 * фиксированный набор строк") and the reason `Spec` is a free-form pair in the
 * first place: STELLA declares six rows, ЭКОЛАЙН five, and a mosquito net
 * entered through the admin panel one day will declare something else again.
 *
 * A `<dl>` rather than a `<table>`: these are name/value pairs about one thing,
 * not a grid comparing several, and a two-column table would claim a row/column
 * relationship to a screen reader that does not exist.
 */
export function SpecTable({ specs }: { specs: Spec[] }) {
  return (
    <dl className="divide-y divide-brand-black/8 border-y border-brand-black/8">
      {specs.map((spec) => (
        <div
          key={spec.name}
          // Stacked on narrow screens: "Тип открывания" / "Поворотно-откидное и
          // поворотное" cannot share a line on a phone in any of the four
          // locales, and Tajik runs longer again (DESIGN.md §10).
          className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
        >
          <dt className="text-sm leading-6 text-brand-black/55">{spec.name}</dt>
          <dd className="text-base font-semibold text-brand-black sm:text-right">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
