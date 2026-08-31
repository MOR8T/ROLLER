import { siteConfig } from "@/lib/site-config";
import type { Lead } from "@/types";

/**
 * Lead submission — the one place the order of operations is decided.
 *
 * The order is **save first, WhatsApp second** (`project_plan/06-*.md`, and
 * decision 13 in `DESIGN.md`): the database is the archive, WhatsApp is the
 * working channel. Doing it the other way round loses the lead silently —
 * a visitor who opens WhatsApp and never presses send simply disappears, and
 * the client never learns that they existed.
 *
 * Posts to `/api/leads` and `/api/leads/quick`, which the route handlers
 * under `app/api/leads` proxy to the backend's `Lead` table — see those
 * routes' comments for why the indirection exists.
 */

export interface LeadReceipt {
  id: string;
}

/** Thrown when the lead could not be stored. Never swallowed by the caller. */
export class LeadSubmitError extends Error {
  constructor(message = "Lead could not be stored") {
    super(message);
    this.name = "LeadSubmitError";
  }
}

/**
 * Stores the lead.
 *
 * Rejects an incomplete payload before the network round-trip rather than
 * letting the backend's own validation catch it: a form that reports success
 * on nothing is the failure mode this whole store-first ordering exists to
 * prevent, and there is no case where an incomplete `Lead` reaching here is
 * anything but a caller bug.
 */
export async function submitLead(lead: Lead): Promise<LeadReceipt> {
  if (!lead.name || !lead.phone || !lead.city || !lead.productType) {
    throw new LeadSubmitError("Incomplete lead payload");
  }

  let response: Response;
  try {
    response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: lead.scenario,
        name: lead.name,
        phone: lead.phone,
        city: lead.city,
        product_type: lead.productType,
        comment: lead.comment,
        configuration: lead.configuration,
      }),
    });
  } catch {
    throw new LeadSubmitError("Network error");
  }

  if (!response.ok) {
    throw new LeadSubmitError("Backend rejected the lead");
  }

  const data = (await response.json()) as { id: number };
  return { id: String(data.id) };
}

/**
 * A phone number, and at most a name and a scenario — the homepage's two short
 * forms (the "вызвать замерщика" strip and the block that closes the page).
 *
 * ⚠️ It carried a `scenario` («Рассчитать» / «Получить КП» / «Стать дилером»)
 * until 2026-08-20, when the client removed those chips from the form. The
 * long `Lead` still has one — `RequestForm` still asks.
 *
 * It is a separate call rather than a `Lead` with blank fields because the two
 * make different promises. `submitLead` refuses an incomplete payload on
 * purpose: a form that reports success on nothing is the failure this ordering
 * exists to prevent. A form that asks for one field is not incomplete — it is a
 * different, deliberately smaller request, and the call centre gets the city
 * and the product on the phone. The stub still refuses a number that cannot be
 * one, which is the only field either form actually has.
 *
 * Same order as `submitLead`: store first, WhatsApp second.
 */
export interface QuickLead {
  phone: string;
  name?: string;
  /**
   * Catalog categories the visitor ticked, as slugs. Optional because the form
   * does not require them: a request with a phone number and nothing else is
   * still a request, and the call centre asks the rest.
   */
  interests?: string[];
  /**
   * Where the request came from, already written for a human — «Система
   * ROLLER». The page supplies it; the form never guesses.
   */
  context?: string;
  /** Whatever the visitor wanted to add. Optional, and usually empty. */
  message?: string;
}

export async function submitQuickLead(lead: QuickLead): Promise<LeadReceipt> {
  if (!isPlausiblePhone(lead.phone)) {
    throw new LeadSubmitError("Implausible phone number");
  }

  let response: Response;
  try {
    response = await fetch("/api/leads/quick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
  } catch {
    throw new LeadSubmitError("Network error");
  }

  if (!response.ok) {
    throw new LeadSubmitError("Backend rejected the lead");
  }

  const data = (await response.json()) as { id: number };
  return { id: String(data.id) };
}

/**
 * The WhatsApp text for a quick lead. Every label is already translated by the
 * caller, and the optional lines are omitted rather than sent empty — a message
 * reading "Имя:" with nothing after it tells the call centre less than no line
 * at all.
 */
export function buildQuickLeadMessage(
  lead: QuickLead,
  labels: {
    intro: string;
    phone: string;
    name?: string;
    interests?: string;
    context?: string;
    message?: string;
  },
  /** The ticked categories, translated by the caller, in display order. */
  interestLabels: string[] = [],
): string {
  const lines = [labels.intro, ""];

  if (labels.context && lead.context) lines.push(`${labels.context}: ${lead.context}`);
  if (labels.interests && interestLabels.length > 0) {
    lines.push(`${labels.interests}: ${interestLabels.join(", ")}`);
  }
  if (labels.name && lead.name) lines.push(`${labels.name}: ${lead.name}`);
  lines.push(`${labels.phone}: ${lead.phone}`);

  // Last, and on its own lines: a comment can run to several sentences, and
  // wedging it between two labelled fields makes the short ones hard to find.
  if (labels.message && lead.message) lines.push("", `${labels.message}:`, lead.message);

  return lines.join("\n");
}

/**
 * The WhatsApp message. Every line is already translated by the caller — the
 * call centre reads the request in the language the visitor was reading, and
 * the scenario is spelled out because a human, not a workflow, routes it.
 */
export function buildLeadMessage(
  lead: Lead,
  labels: {
    intro: string;
    scenario: string;
    name: string;
    phone: string;
    city: string;
    productType: string;
    comment: string;
    configuration: string;
  },
  scenarioLabel: string,
): string {
  const lines = [
    labels.intro,
    "",
    `${labels.scenario}: ${scenarioLabel}`,
    `${labels.name}: ${lead.name}`,
    `${labels.phone}: ${lead.phone}`,
    `${labels.city}: ${lead.city}`,
    `${labels.productType}: ${lead.productType}`,
  ];

  if (lead.comment) {
    lines.push(`${labels.comment}: ${lead.comment}`);
  }

  if (lead.configuration) {
    lines.push("", `${labels.configuration}:`, lead.configuration);
  }

  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  return `${siteConfig.whatsappHref}?text=${encodeURIComponent(message)}`;
}

/**
 * Phone validation, deliberately loose.
 *
 * Tajik numbers are written `+992 700 600 700`, `992700600700` and
 * `900-11-22-33` in equal measure, and a visitor whose valid number is
 * rejected by a regex is a lead lost at the last step. Nine digits is the
 * shortest thing that can be a phone number here; the rest is the call
 * centre's job.
 */
export function isPlausiblePhone(value: string): boolean {
  return (value.match(/\d/g) ?? []).length >= 9;
}
