"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { ItemCard } from "@/components/calculator/item-card";
import { RequestModal } from "@/components/calculator/request-modal";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  MAX_ITEMS,
  createItem,
  findScheme,
  reconcile,
  type ConfiguredItem,
} from "@/data/calculator";

/**
 * The configurator (`project_plan/06-*.md`, decision 14), rebuilt on
 * 2026-08-23 to the shape of `imzo.uz/calculator` at the client's request.
 *
 * One departure from imzo, also the client's: «Окно / Дверь» is not a switch
 * over the whole page but a field of each position, so one request can carry a
 * window and a door. imzo's own switch converts everything and cannot.
 *
 * It is **not** a price calculator and never shows a number in somoni: the
 * brief asks for a calculator in §2.1 and forbids prices in §5.3, and the
 * parameters it collects could not produce one anyway. What it produces is a
 * described construction attached to a request — the resolution `imzo.uz`
 * reaches too, at the end of the same flow.
 *
 * Every edit goes through `reconcile` in `data/calculator.ts` rather than being
 * guarded field by field, because the invalid states all have one shape: a
 * choice that was legal under the previous selection surviving into the next.
 */
/** `win_8` -> `W-8`, `door_3` -> `D-3`. A filename is not a thing to show. */
function variantCode(variant: string): string {
  const [kind, number] = variant.split("_");
  return `${kind === "door" ? "D" : "W"}-${number}`;
}

export function Calculator() {
  const t = useTranslations("calculator");
  const tBrands = useTranslations("brands");
  const tColors = useTranslations("colors");

  // Ids are handed out from here rather than by `createItem` itself: a
  // module-level counter is shared with the server render and with StrictMode's
  // second pass, so a position came back with a different id every time and the
  // tree could not hydrate.
  const nextId = useRef(1);
  const [items, setItems] = useState<ConfiguredItem[]>(() => [createItem("item-1", "window")]);
  const [requesting, setRequesting] = useState(false);

  // A new position opens as the same construction as the last one: somebody
  // adding a fourth window is not asking to start over on a door.
  const addItem = () =>
    setItems((current) => {
      nextId.current += 1;
      return [
        ...current,
        createItem(`item-${nextId.current}`, current[current.length - 1]?.construction ?? "window"),
      ];
    });

  const update = (id: string, patch: Partial<ConfiguredItem>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? reconcile({ ...item, ...patch }) : item)),
    );

  const describe = useCallback(
    (item: ConfiguredItem, index: number) => {
      const scheme = findScheme(item.variant);
      const parts = [
        t(`construction.${item.construction}`),
        `${t(`materials.${item.material}`)} ${tBrands(`items.${item.system}.name`)}`,
        scheme ? t(`groups.${item.construction}.${scheme.columns}`) : null,
        `${item.widthMm}×${item.heightMm} ${t("units.mm")}`,
        t(`glazing.${item.glazing}`),
        t(`mechanisms.${item.mechanism}`),
        `${t("labels.lamination")}: ${tColors(item.lamination)}`,
        `${t("labels.hardware")}: ${tColors(item.hardware)}`,
        `${item.quantity} ${t("units.pcs")}`,
      ].filter(Boolean);

      if (item.accessories.length > 0) {
        parts.push(item.accessories.map((key) => t(`accessories.${key}`)).join(", "));
      }
      // The drawing is the one thing a text summary cannot carry, so the
      // variant travels as a code the sales desk can look the scheme up by.
      parts.push(t("variantCode", { code: variantCode(item.variant) }));

      return `${index + 1}. ${parts.join(" · ")}`;
    },
    [t, tBrands, tColors],
  );

  // Read at submit time by `RequestForm`, not rendered into it: the summary
  // changes with every slider move and the form has no business re-rendering.
  const buildConfiguration = useCallback(() => items.map(describe).join("\n"), [items, describe]);

  return (
    <Section className="pt-8">
      <Container>
        <div className="space-y-5">
          {items.map((item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              index={index}
              removable={items.length > 1}
              onChange={(patch) => update(item.id, patch)}
              onRemove={() =>
                setItems((current) => current.filter((candidate) => candidate.id !== item.id))
              }
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= MAX_ITEMS}
          className="mt-5 flex min-h-16 w-full items-center justify-center gap-2 rounded-card border border-dashed border-brand-black/25 text-sm font-medium text-brand-black transition-colors hover:border-brand-red hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45"
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          {t("item.add")}
        </button>

        <button
          type="button"
          onClick={() => setRequesting(true)}
          className="mt-4 min-h-16 w-full rounded-card bg-brand-black text-base font-semibold text-brand-white transition-colors hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t("submit")}
        </button>

        <p className="mt-4 text-sm leading-6 text-brand-black/55">{t("noPrice")}</p>
      </Container>

      <RequestModal
        open={requesting}
        onClose={() => setRequesting(false)}
        summary={items.map(describe)}
        buildConfiguration={buildConfiguration}
      />
    </Section>
  );
}
