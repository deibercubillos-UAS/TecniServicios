/** Cursor de paginación keyset (docs/12-MODULE-CATALOG.md sección 4: nunca
 * offset). Codifica el valor de la columna de orden + el id como desempate,
 * para paginar sobre `(orden, id)` sin resultados repetidos ni saltados. */
export interface Cursor {
  value: string;
  id: string;
}

export function encodeCursor(value: string, id: string): string {
  return Buffer.from(JSON.stringify({ value, id }), "utf-8").toString("base64url");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// `id` y `value` terminan embebidos en el filtro `.or()` de PostgREST
// (apps/web/app/(public)/catalogo/page.tsx, ver `quoteFilterValue`). `id`
// se valida como UUID acá porque nunca necesita comillas; `value` (nombre o
// fecha del producto) se escapa ahí mismo antes de concatenarlo — esta
// función solo pone un límite de tamaño razonable, un `after` forjado a mano
// no debería poder mandar payloads arbitrariamente grandes.
function isSafeCursor(cursor: Cursor): boolean {
  return UUID_RE.test(cursor.id) && cursor.value.length > 0 && cursor.value.length <= 500;
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "value" in parsed &&
      "id" in parsed &&
      typeof (parsed as Cursor).value === "string" &&
      typeof (parsed as Cursor).id === "string" &&
      isSafeCursor(parsed as Cursor)
    ) {
      return parsed as Cursor;
    }
    return null;
  } catch {
    return null;
  }
}
