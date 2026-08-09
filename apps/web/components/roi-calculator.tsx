"use client";

import { useState } from "react";
// Import de subpath, no del barrel `@tecni/core` — el barrel reexporta
// `process-wompi-webhook.ts`, que importa `node:crypto`; un componente
// cliente no puede llevar eso al bundle del navegador.
import { calculateRoi, type RoiResult } from "@tecni/core/tools/calculate-roi";

/**
 * Única excepción real de este proyecto a "Server Components por
 * defecto" fuera de `global-error.tsx` (exigido por Next.js) — una
 * calculadora necesita recalcular en cada tecla sin recargar la página;
 * un Server Action por cambio sería una experiencia mala de verdad, no
 * una preferencia estética. Cálculo puro, sin sesión ni base de datos.
 */
export function RoiCalculator() {
  const [equipmentPriceCop, setEquipmentPriceCop] = useState("");
  const [servicesPerMonth, setServicesPerMonth] = useState("");
  const [revenuePerServiceCop, setRevenuePerServiceCop] = useState("");
  const [costPerServiceCop, setCostPerServiceCop] = useState("");

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
            onChange={(e) => setEquipmentPriceCop(e.target.value)}
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
