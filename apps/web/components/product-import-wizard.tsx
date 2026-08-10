"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Icon } from "@tecni/ui";
import type { BulkImportProductsResult, BulkImportRow } from "@tecni/core";

import { bulkImportProductsAction } from "@/app/(staff)/admin/productos/importar/actions";

const TARGET_FIELDS: { key: keyof BulkImportRow; label: string; required: boolean }[] = [
  { key: "sku", label: "SKU", required: true },
  { key: "name", label: "Nombre", required: true },
  { key: "categoryName", label: "Categoría", required: true },
  { key: "brandName", label: "Marca", required: false },
  { key: "type", label: "Tipo (equipment/part/supply)", required: false },
  { key: "shortDescription", label: "Descripción corta", required: false },
  { key: "description", label: "Descripción", required: false },
  { key: "warrantyMonths", label: "Garantía (meses)", required: false },
];

type Mapping = Partial<Record<keyof BulkImportRow, number>>;

function mappingStorageKey(headers: string[]): string {
  return `tecni-import-mapping:${headers.join("|")}`;
}

function guessMapping(headers: string[]): Mapping {
  const mapping: Mapping = {};
  const normalized = headers.map((h) => h.toLowerCase().trim());
  const guesses: Record<keyof BulkImportRow, string[]> = {
    sku: ["sku", "código", "codigo", "referencia"],
    name: ["nombre", "descripción producto", "descripcion producto", "producto"],
    categoryName: ["categoría", "categoria", "grupo"],
    brandName: ["marca"],
    type: ["tipo"],
    shortDescription: ["descripción corta", "descripcion corta"],
    description: ["descripción", "descripcion"],
    warrantyMonths: ["garantía", "garantia", "garantía (meses)"],
  };
  for (const [field, candidates] of Object.entries(guesses) as [keyof BulkImportRow, string[]][]) {
    const index = normalized.findIndex((h) => candidates.includes(h));
    if (index !== -1) mapping[field] = index;
  }
  return mapping;
}

export function ProductImportWizard() {
  const [step, setStep] = useState<"upload" | "map" | "result">("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportProductsResult | null>(null);

  const missingRequired = TARGET_FIELDS.filter((f) => f.required && mapping[f.key] === undefined);

  const mappedRows: BulkImportRow[] = useMemo(() => {
    if (missingRequired.length > 0) return [];
    return dataRows.map((row) => {
      const get = (key: keyof BulkImportRow) => {
        const index = mapping[key];
        return index === undefined ? "" : (row[index] ?? "").toString().trim();
      };
      const warrantyRaw = get("warrantyMonths");
      return {
        sku: get("sku"),
        name: get("name"),
        categoryName: get("categoryName"),
        brandName: get("brandName") || undefined,
        type: get("type") || undefined,
        shortDescription: get("shortDescription") || undefined,
        description: get("description") || undefined,
        warrantyMonths: warrantyRaw ? Number.parseInt(warrantyRaw, 10) : undefined,
      };
    });
  }, [dataRows, mapping, missingRequired.length]);

  function handleFile(file: File) {
    setParseError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]!];
        if (!firstSheet) throw new Error("El archivo no tiene hojas.");
        const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, blankrows: false, defval: "" });
        if (rows.length < 2) throw new Error("El archivo no tiene filas de datos (solo encabezado, o está vacío).");

        const fileHeaders = rows[0]!.map((h) => String(h));
        const rest = rows.slice(1).map((r) => r.map((cell) => String(cell)));
        setHeaders(fileHeaders);
        setDataRows(rest);

        const stored = window.localStorage.getItem(mappingStorageKey(fileHeaders));
        setMapping(stored ? (JSON.parse(stored) as Mapping) : guessMapping(fileHeaders));
        setStep("map");
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "No se pudo leer el archivo.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function updateMapping(field: keyof BulkImportRow, value: string) {
    setMapping((current) => {
      const next = { ...current };
      if (value === "") delete next[field];
      else next[field] = Number.parseInt(value, 10);
      return next;
    });
  }

  function saveMappingAndContinue() {
    window.localStorage.setItem(mappingStorageKey(headers), JSON.stringify(mapping));
    setStep("result");
  }

  async function handleImport() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const outcome = await bulkImportProductsAction(mappedRows);
      setResult(outcome);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo importar.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setDataRows([]);
    setMapping({});
    setResult(null);
    setSubmitError(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {step === "upload" ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="document" size={26} />
          </span>
          <p className="font-semibold text-text">Sube el Excel exportado desde Siigo</p>
          <p className="max-w-md text-sm text-text-muted">
            En el siguiente paso eliges qué columna del archivo corresponde a cada dato — no se asume un formato fijo.
          </p>
          <label className="mt-2 cursor-pointer rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover">
            Elegir archivo
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          {parseError ? (
            <p role="alert" className="mt-2 flex items-center gap-2 text-sm text-danger">
              <Icon name="close" size={14} />
              {parseError}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === "map" ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              <span className="font-medium text-text">{fileName}</span> · {dataRows.length} filas de datos
            </p>
            <button type="button" onClick={reset} className="text-sm text-brand hover:underline">
              Elegir otro archivo
            </button>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 font-bold text-text">Asocia cada columna</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label htmlFor={`map-${field.key}`} className="text-sm font-medium text-text-muted">
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                  <select
                    id={`map-${field.key}`}
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => updateMapping(field.key, e.target.value)}
                    className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  >
                    <option value="">Sin asociar</option>
                    {headers.map((header, index) => (
                      <option key={index} value={index}>
                        {header || `Columna ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {missingRequired.length > 0 ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-warning">
                <Icon name="clock" size={14} />
                Falta asociar: {missingRequired.map((f) => f.label).join(", ")}
              </p>
            ) : null}
          </div>

          {mappedRows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg-alt text-xs text-text-muted">
                  <tr>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Categoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mappedRows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-text">{row.sku || "—"}</td>
                      <td className="px-3 py-2 text-text">{row.name || "—"}</td>
                      <td className="px-3 py-2 text-text-muted">{row.categoryName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mappedRows.length > 5 ? (
                <p className="border-t border-border px-3 py-2 text-xs text-text-muted">
                  Mostrando 5 de {mappedRows.length} filas.
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={saveMappingAndContinue}
            disabled={missingRequired.length > 0}
            className="w-fit rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      ) : null}

      {step === "result" ? (
        <div className="flex flex-col gap-4">
          {!result ? (
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="mb-4 text-sm text-text-muted">
                {mappedRows.length} filas listas para importar desde <span className="font-medium text-text">{fileName}</span>. Ningún
                precio ni stock se toca. Los productos nuevos quedan como borrador, sin publicar, hasta que les subas fotos y
                ficha técnica y los actives manualmente.
              </p>
              {submitError ? (
                <p role="alert" className="mb-4 flex items-center gap-2 text-sm text-danger">
                  <Icon name="close" size={14} />
                  {submitError}
                </p>
              ) : null}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("map")}
                  className="rounded-[var(--radius)] border border-border px-4 py-2.5 text-sm font-medium text-text hover:border-brand"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-[var(--radius)] bg-brand px-5 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Importando…" : "Importar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-surface p-4 text-center">
                  <span className="block text-2xl font-extrabold text-success">{result.created}</span>
                  <span className="text-xs text-text-muted">Creados</span>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4 text-center">
                  <span className="block text-2xl font-extrabold text-brand">{result.updated}</span>
                  <span className="text-xs text-text-muted">Actualizados</span>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4 text-center">
                  <span className="block text-2xl font-extrabold text-danger">{result.errors}</span>
                  <span className="text-xs text-text-muted">Errores</span>
                </div>
              </div>

              {result.rows.filter((r) => r.status === "error").length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-danger/40">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-danger/10 text-xs text-text-muted">
                      <tr>
                        <th className="px-3 py-2">Fila</th>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.rows
                        .filter((r) => r.status === "error")
                        .map((r) => (
                          <tr key={r.row}>
                            <td className="px-3 py-2 text-text">{r.row}</td>
                            <td className="px-3 py-2 text-text">{r.sku}</td>
                            <td className="px-3 py-2 text-danger">{r.message}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <button type="button" onClick={reset} className="w-fit text-sm font-medium text-brand hover:underline">
                Importar otro archivo
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
