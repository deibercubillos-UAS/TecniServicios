"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@tecni/ui";
// Import de subpath, no del barrel `@tecni/core` — el barrel reexporta
// `process-wompi-webhook.ts`, que importa `node:crypto`; un componente
// cliente no puede llevar eso al bundle del navegador.
import { calculateRoi, type RoiResult } from "@tecni/core/tools/calculate-roi";

export interface EquipmentCategory {
  id: string;
  name: string;
}

export interface EquipmentOption {
  id: string;
  name: string;
  categoryId: string;
  priceCop: number;
  priceIsStale: boolean;
}

/**
 * Única excepción real de este proyecto a "Server Components por
 * defecto" fuera de `global-error.tsx` (exigido por Next.js) — una
 * calculadora necesita recalcular en cada tecla sin recargar la página;
 * un Server Action por cambio sería una experiencia mala de verdad, no
 * una preferencia estética.
 *
 * `equipment` solo llega con filas cuando hay sesión (ver page.tsx —
 * `products` no es legible por `anon`, regla de negocio 5.1). Sin
 * sesión, el selector de equipo real no se ofrece: se explica por qué
 * y se deja la entrada manual, nunca un precio inventado.
 */
export function RoiCalculator({
  categories,
  equipment,
  isLoggedIn,
}: {
  categories: EquipmentCategory[];
  equipment: EquipmentOption[];
  isLoggedIn: boolean;
}) {
  const [mode, setMode] = useState<"picker" | "manual">(isLoggedIn && equipment.length > 0 ? "picker" : "manual");
  const [categoryId, setCategoryId] = useState("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [equipmentPriceCop, setEquipmentPriceCop] = useState("");
  const [servicesPerMonth, setServicesPerMonth] = useState("");
  const [revenuePerServiceCop, setRevenuePerServiceCop] = useState("");
  const [costPerServiceCop, setCostPerServiceCop] = useState("");

  const filteredEquipment = useMemo(
    () => (categoryId ? equipment.filter((e) => e.categoryId === categoryId) : equipment),
    [equipment, categoryId],
  );
  const selectedEquipment = equipment.find((e) => e.id === selectedEquipmentId) ?? null;

  function handleSelectEquipment(id: string) {
    setSelectedEquipmentId(id);
    const eq = equipment.find((e) => e.id === id);
    if (eq) setEquipmentPriceCop(String(eq.priceCop));
  }

  const parsed = {
    equipmentPriceCop: Number.parseFloat(equipmentPriceCop) || 0,
    servicesPerMonth: Number.parseFloat(servicesPerMonth) || 0,
    revenuePerServiceCop: Number.parseFloat(revenuePerServiceCop) || 0,
    costPerServiceCop: Number.parseFloat(costPerServiceCop) || 0,
  };

  const hasInput = equipmentPriceCop !== "" && servicesPerMonth !== "" && revenuePerServiceCop !== "";
  const result: RoiResult | null = hasInput ? calculateRoi(parsed) : null;

  return (
    <div className="flex flex-col gap-6">
      {isLoggedIn && equipment.length > 0 ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">¿Qué equipo estás evaluando?</h2>
            <button
              type="button"
              onClick={() => setMode(mode === "picker" ? "manual" : "picker")}
              className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <Icon name="sliders" size={14} />
              {mode === "picker" ? "Ingresar precio manualmente" : "Elegir equipo del catálogo"}
            </button>
          </div>

          {mode === "picker" ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="categoryFilter" className="text-sm text-text-muted">
                  Categoría
                </label>
                <select
                  id="categoryFilter"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSelectedEquipmentId("");
                  }}
                  className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="equipmentSelect" className="text-sm text-text-muted">
                  Equipo
                </label>
                <select
                  id="equipmentSelect"
                  value={selectedEquipmentId}
                  onChange={(e) => handleSelectEquipment(e.target.value)}
                  className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
                >
                  <option value="">Selecciona un equipo...</option>
                  {filteredEquipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} — ${eq.priceCop.toLocaleString("es-CO")}
                      {eq.priceIsStale ? " (sujeto a confirmación)" : ""}
                    </option>
                  ))}
                </select>
                {filteredEquipment.length === 0 ? (
                  <p className="text-xs text-text-muted">No hay equipos con precio disponible en esta categoría.</p>
                ) : null}
              </div>
              {selectedEquipment?.priceIsStale ? (
                <p className="text-xs text-warning">Precio sujeto a confirmación — puede variar al cotizar.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg border border-border bg-bg-alt p-4 text-sm text-text-muted">
          <Link href="/login" className="font-medium text-brand hover:underline">
            Inicia sesión
          </Link>{" "}
          para elegir un equipo real del catálogo y autocompletar su precio. Mientras tanto, puedes ingresarlo manualmente abajo.
        </p>
      )}

      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-1">
          <label htmlFor="equipmentPriceCop" className="text-sm text-text-muted">
            Precio del equipo (COP)
          </label>
          <input
            id="equipmentPriceCop"
            type="number"
            min={0}
            value={equipmentPriceCop}
            onChange={(e) => {
              setEquipmentPriceCop(e.target.value);
              setSelectedEquipmentId("");
            }}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="servicesPerMonth" className="text-sm text-text-muted">
            Servicios por mes
          </label>
          <input
            id="servicesPerMonth"
            type="number"
            min={0}
            value={servicesPerMonth}
            onChange={(e) => setServicesPerMonth(e.target.value)}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="revenuePerServiceCop" className="text-sm text-text-muted">
            Ingreso por servicio (COP)
          </label>
          <input
            id="revenuePerServiceCop"
            type="number"
            min={0}
            value={revenuePerServiceCop}
            onChange={(e) => setRevenuePerServiceCop(e.target.value)}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="costPerServiceCop" className="text-sm text-text-muted">
            Costo por servicio (COP, opcional)
          </label>
          <input
            id="costPerServiceCop"
            type="number"
            min={0}
            value={costPerServiceCop}
            onChange={(e) => setCostPerServiceCop(e.target.value)}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
      </form>

      {result ? (
        <div className="rounded-lg border border-border p-4">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Utilidad neta por servicio</dt>
              <dd className="font-semibold text-text">${result.netProfitPerServiceCop.toLocaleString("es-CO")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Utilidad mensual estimada</dt>
              <dd className="font-semibold text-text">${result.monthlyProfitCop.toLocaleString("es-CO")}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="text-text-muted">Meses para recuperar la inversión</dt>
              <dd className="text-lg font-bold text-brand">
                {result.monthsToBreakEven !== null ? `${result.monthsToBreakEven.toFixed(1)} meses` : "No se recupera con estos datos"}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="text-sm text-text-muted">Completa precio del equipo, servicios por mes e ingreso por servicio para ver el resultado.</p>
      )}
    </div>
  );
}
