/**
 * FastAPI's `detail` is a string for the errors this app raises itself and an
 * array of field errors for a failed Pydantic validation — a payload missing
 * a required field, say. Both have to reach the admin as one readable line,
 * so every `adminRequest` helper across `admin-sections/*-actions.ts` funnels
 * a failed response's parsed body through this before returning it.
 */
export function describeError(body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined;
    if (first?.msg) return first.msg.replace(/^Value error, /, "");
  }

  return "Не удалось выполнить запрос";
}
