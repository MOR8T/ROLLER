"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  deleteLeadAction,
  setLeadReviewedAction,
  type AdminLeadDto,
} from "@/components/admin-sections/leads-actions";

const SCENARIO_LABELS: Record<string, string> = {
  calculate: "Рассчитать",
  quote: "Получить КП",
  dealer: "Стать дилером",
};

const CITY_LABELS: Record<string, string> = {
  dushanbe: "Душанбе",
  khujand: "Худжанд",
  bokhtar: "Бохтар",
  kulob: "Куляб",
  other: "Другой город",
};

type Filter = "all" | "new" | "reviewed";

/**
 * The one inbox `lib/leads.ts`'s "store first" order was written for — every
 * request that reached the backend, calculator configurations and quick
 * "Свяжитесь с нами" pings alike. `kind` decides which fields a row shows;
 * `isReviewed` is a single triage flag on purpose, not a workflow — see
 * `Lead`'s docstring on the backend for why.
 */
export function LeadsManager({ initialLeads }: { initialLeads: AdminLeadDto[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<Filter>("all");
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(() => {
    if (filter === "new") return leads.filter((lead) => !lead.isReviewed);
    if (filter === "reviewed") return leads.filter((lead) => lead.isReviewed);
    return leads;
  }, [leads, filter]);

  const newCount = leads.filter((lead) => !lead.isReviewed).length;

  function toggleReviewed(lead: AdminLeadDto) {
    const next = !lead.isReviewed;
    startTransition(async () => {
      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? { ...item, isReviewed: next } : item)),
      );
      const result = await setLeadReviewedAction(lead.id, next);
      if (!result.success) {
        showToast(result.error);
        router.refresh();
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("Удалить эту заявку?")) return;

    startTransition(async () => {
      setLeads((current) => current.filter((item) => item.id !== id));
      const result = await deleteLeadAction(id);
      if (!result.success) {
        showToast(result.error);
        router.refresh();
      }
    });
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          Все ({leads.length})
        </FilterButton>
        <FilterButton active={filter === "new"} onClick={() => setFilter("new")}>
          Новые ({newCount})
        </FilterButton>
        <FilterButton active={filter === "reviewed"} onClick={() => setFilter("reviewed")}>
          Обработанные ({leads.length - newCount})
        </FilterButton>
      </div>

      <div className="mt-5 space-y-3">
        {visible.length === 0 ? (
          <p className="text-sm text-neutral-500">Заявок пока нет.</p>
        ) : (
          visible.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              disabled={isPending}
              onToggleReviewed={() => toggleReviewed(lead)}
              onDelete={() => remove(lead.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-black bg-brand-black text-brand-white"
          : "border-brand-black/20 text-brand-black hover:border-brand-black/45",
      )}
    >
      {children}
    </button>
  );
}

function LeadRow({
  lead,
  disabled,
  onToggleReviewed,
  onDelete,
}: {
  lead: AdminLeadDto;
  disabled: boolean;
  onToggleReviewed: () => void;
  onDelete: () => void;
}) {
  const createdAt = new Date(lead.createdAt).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "rounded-card border p-5",
        lead.isReviewed ? "border-brand-black/10" : "border-brand-red/30 bg-brand-red/[0.03]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-base font-semibold text-brand-black">
              {lead.name || "Без имени"}
            </span>
            <a href={`tel:${lead.phone}`} className="text-sm text-brand-black/70 hover:underline">
              {lead.phone}
            </a>
            <span className="rounded-full bg-brand-black/5 px-2.5 py-0.5 text-xs font-medium text-brand-black/60">
              {lead.kind === "full" ? "Заявка" : "Быстрая заявка"}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">{createdAt}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={onToggleReviewed}
          >
            {lead.isReviewed ? "Отметить новой" : "Отметить обработанной"}
          </Button>
          <button
            type="button"
            aria-label="Удалить заявку"
            disabled={disabled}
            onClick={onDelete}
            className="grid size-9 shrink-0 place-items-center rounded-control text-brand-black/45 transition-colors hover:bg-brand-red/10 hover:text-brand-red disabled:pointer-events-none disabled:opacity-45"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {lead.scenario ? (
          <Detail label="Сценарий" value={SCENARIO_LABELS[lead.scenario] ?? lead.scenario} />
        ) : null}
        {lead.city ? <Detail label="Город" value={CITY_LABELS[lead.city] ?? lead.city} /> : null}
        {lead.productType ? <Detail label="Тип продукции" value={lead.productType} /> : null}
        {lead.context ? <Detail label="Источник" value={lead.context} /> : null}
        {lead.interests && lead.interests.length > 0 ? (
          <Detail label="Интересует" value={lead.interests.join(", ")} />
        ) : null}
      </dl>

      {lead.comment ? (
        <p className="mt-3 rounded-control bg-surface-muted p-3 text-sm text-brand-black/75">
          {lead.comment}
        </p>
      ) : null}
      {lead.message ? (
        <p className="mt-3 rounded-control bg-surface-muted p-3 text-sm text-brand-black/75">
          {lead.message}
        </p>
      ) : null}
      {lead.configuration ? (
        <pre className="mt-3 overflow-x-auto rounded-control bg-surface-muted p-3 text-xs whitespace-pre-wrap text-brand-black/75">
          {lead.configuration}
        </pre>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-brand-black/45">{label}:</dt>
      <dd className="text-brand-black/85">{value}</dd>
    </div>
  );
}
