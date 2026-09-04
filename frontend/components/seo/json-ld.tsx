import type { JsonLdNode } from "@/lib/json-ld";

/**
 * Renders one or more schema.org graphs as `application/ld+json`.
 *
 * `dangerouslySetInnerHTML` is how Next's own docs put JSON-LD on a page, and
 * it is safe here in a way the name does not suggest: the payload is
 * `JSON.stringify`'d, never interpolated, so the only injection surface is the
 * `</script>` sequence — which is why `<` is escaped below rather than left to
 * chance. Admin-typed strings (a legal name, a page title) flow through here,
 * so that escape is doing real work, not ceremony.
 *
 * `null` entries are dropped, which is what lets the builders in
 * `lib/json-ld.ts` return `null` when they have nothing worth saying and the
 * callers stay free of conditionals.
 */
export function JsonLd({ data }: { data: (JsonLdNode | null)[] | JsonLdNode | null }) {
  const nodes = (Array.isArray(data) ? data : [data]).filter(
    (node): node is JsonLdNode => node !== null,
  );
  if (nodes.length === 0) return null;

  return (
    <>
      {nodes.map((node, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(node).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
