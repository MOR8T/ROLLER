import { ButtonLink } from "@/components/ui/button";
import { MediaFrame } from "@/components/ui/media-frame";

/**
 * What a category looks like between an admin creating it and filling it.
 *
 * ⚠️ Not a hypothetical: «Москитные сетки» ships in that state — the six
 * seeded systems claim the other five categories and none of them claims it
 * (`backend/app/startup.py`'s `_PRODUCT_CATEGORIES_SEED`).
 *
 * It used to be one grey sentence alone in a section a screen tall. The
 * sentence is still the heading — it is the honest answer to what the visitor
 * came for — but it now sits next to the category's own photograph and two
 * ways onward, so an empty section reads as "not yet" rather than as a page
 * that failed to load.
 *
 * The second action is `#contacts`, the request block this page already ends
 * on, and not a WhatsApp link: reaching one means `getContactInfo`, a second
 * backend round-trip, for a state that is temporary by nature.
 */
export function CategoryEmptyState({
  image,
  title,
  line,
  hint,
  calculatorLabel,
  contactLabel,
}: {
  image: string;
  /** «Раздел ещё наполняется» — a heading, so no full stop. */
  title: string;
  /** «В этой категории пока нет продукции.» — the honest answer, first. */
  line: string;
  hint: string;
  calculatorLabel: string;
  contactLabel: string;
}) {
  return (
    <div className="grid items-center gap-8 rounded-card border border-brand-black/10 bg-surface p-6 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10">
      <MediaFrame
        src={image}
        alt=""
        width={640}
        height={440}
        sizes="(max-width: 1024px) 92vw, 44vw"
        containerClassName="border-0 bg-surface-muted"
      />

      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-brand-black sm:text-3xl">
          {title}
        </h2>

        <p className="mt-4 text-base leading-7 text-brand-black/65">
          {line} {hint}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/calculator">{calculatorLabel}</ButtonLink>
          <ButtonLink href="#contacts" variant="outline">
            {contactLabel}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
