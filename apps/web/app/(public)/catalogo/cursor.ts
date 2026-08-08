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
      typeof (parsed as Cursor).id === "string"
    ) {
      return parsed as Cursor;
    }
    return null;
  } catch {
    return null;
  }
}
