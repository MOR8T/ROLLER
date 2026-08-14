import { siteConfig } from "@/lib/site-config";
import type { Lead, LeadScenario } from "@/types";

/**
 * Lead submission — the one place the order of operations is decided.
 *
 * The order is **save first, WhatsApp second** (`project_plan/06-*.md`, and
 * decision 13 in `DESIGN.md`): the database is the archive, WhatsApp is the
 * working channel. Doing it the other way round loses the lead silently —
 * a visitor who opens WhatsApp and never presses send simply disappears, and
 * the client never learns that they existed.
 *
 * During the frontend-only phase `submitLead` is a stub with the interface the
 * real call will have, so stage 13 replaces the body of one function and no
 * form is rewritten.
 */

export const leadScenarios = [
  "calculate",
  "quote",
  "dealer",
] as const satisfies readonly LeadScenario[];

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
 * Stores the lead. Stage 13 swaps the body for
 * `fetch("/api/leads", { method: "POST", … })` — the signature, the thrown
 * error and the returned receipt are the contract the backend has to satisfy
 * (`project_plan/11-backend-api.md`).
 *
 * The stub still rejects an empty payload rather than pretending to succeed:
 * a form that reports success on nothing is the failure mode this whole
 * ordering exists to prevent.
 */
export async function submitLead(lead: Lead): Promise<LeadReceipt> {
  if (!lead.name || !lead.phone || !lead.city || !lead.productType) {
    throw new LeadSubmitError("Incomplete lead payload");
  }

  // Stand-in for the network round-trip, so the form's loading state is real
  // and not a branch that only runs in production.
  await new Promise((resolve) => setTimeout(resolve, 400));

  return { id: `local-${Date.now()}` };
}

/**
 * A phone number, and at most a name and a scenario — the homepage's two short
 * forms (the "вызвать замерщика" strip and the block that closes the page).
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
  scenario?: LeadScenario;
}

export async function submitQuickLead(lead: QuickLead): Promise<LeadReceipt> {
  if (!isPlausiblePhone(lead.phone)) {
    throw new LeadSubmitError("Implausible phone number");
  }

  await new Promise((resolve) => setTimeout(resolve, 400));

  return { id: `local-quick-${Date.now()}` };
}

/**
 * The WhatsApp text for a quick lead. Every label is already translated by the
 * caller, and the optional lines are omitted rather than sent empty — a message
 * reading "Имя:" with nothing after it tells the call centre less than no line
 * at all.
 */
export function buildQuickLeadMessage(
  lead: QuickLead,
  labels: { intro: string; phone: string; name?: string; scenario?: string },
  scenarioLabel?: string,
): string {
  const lines = [labels.intro, ""];

  if (labels.scenario && scenarioLabel) lines.push(`${labels.scenario}: ${scenarioLabel}`);
  if (labels.name && lead.name) lines.push(`${labels.name}: ${lead.name}`);
  lines.push(`${labels.phone}: ${lead.phone}`);

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
