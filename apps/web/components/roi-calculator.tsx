"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@tecni/ui";
// Import de subpath, no del barrel `@tecni/core` — el barrel reexporta
// `process-wompi-webhook.ts`, que importa `node:crypto`; un componente
// cliente no puede llevar eso al bundle del navegador.
import { calculateRoi, type RoiResult } from "@tecni/core/tools/calculate-roi";
import { calculateLoanPayment, type LoanPaymentResult } from "@tecni/core/tools/calculate-loan-payment";

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

type PaymentMethod = "contado" | "financiado";

const STEPS = ["Equipo", "Datos del taller", "Forma de pago", "Resultados"] as const;

function formatCop(value: number): string {
  return `$${Math.round(value).toLocaleString("es-CO")}`;
}

/**
 * Única excepción real de este proyecto a "Server Components por
 * defecto" fuera de `global-error.tsx` — un wizard con recálculo
 * instantáneo necesita estado de cliente.
 *
 * `equipment` solo llega con filas cuando hay sesión (ver page.tsx —
 * `products` no es legible por `anon`, regla de negocio 5.1).
 *
 * "Financiado" usa la tasa que el usuario trae de SU banco — Tecni no
 * ofrece financiación propia (solo pago de contado vía Wompi), así que
 * nunca se sugiere ni se precarga una tasa: el campo empieza vacío.
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
  const [step, setStep] = useState(0);

  // Paso 1: equipo
  const [mode, setMode] = useState<"picker" | "manual">(isLoggedIn && equipment.length > 0 ? "picker" : "manual");
  const [categoryId, setCategoryId] = useState("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [equipmentPriceCop, setEquipmentPriceCop] = useState("");

  // Paso 2: datos del taller
  const [servicesPerMonth, setServicesPerMonth] = useState("");
  const [revenuePerServiceCop, setRevenuePerServiceCop] = useState("");
  const [costPerServiceCop, setCostPerServiceCop] = useState("");

  // Paso 3: forma de pago
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("contado");
  const [loanAmountCop, setLoanAmountCop] = useState("");
  const [annualInterestRatePercent, setAnnualInterestRatePercent] = useState("");
  const [termMonths, setTermMonths] = useState("");

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

  const roiResult: RoiResult | null =
    equipmentPriceCop !== "" && servicesPerMonth !== "" && revenuePerServiceCop !== ""
      ? calculateRoi({
          equipmentPriceCop: Number.parseFloat(equipmentPriceCop) || 0,
          servicesPerMonth: Number.parseFloat(servicesPerMonth) || 0,
          revenuePerServiceCop: Number.parseFloat(revenuePerServiceCop) || 0,
          costPerServiceCop: Number.parseFloat(costPerServiceCop) || 0,
        })
      : null;

  const loanResult: LoanPaymentResult | null =
    paymentMethod === "financiado" && loanAmountCop !== "" && annualInterestRatePercent !== "" && termMonths !== ""
      ? calculateLoanPayment({
          principalCop: Number.parseFloat(loanAmountCop) || 0,
          annualInterestRatePercent: Number.parseFloat(annualInterestRatePercent) || 0,
          termMonths: Number.parseInt(termMonths, 10) || 0,
        })
      : null;

  const monthlyNetCashflow =
    roiResult && loanResult ? roiResult.monthlyProfitCop - loanResult.monthlyPaymentCop : null;

  const step1Complete = equipmentPriceCop !== "" && Number.parseFloat(equipmentPriceCop) > 0;
  const step2Complete = servicesPerMonth !== "" && revenuePerServiceCop !== "";
  const step3Complete = paymentMethod === "contado" || (loanResult !== null && loanResult.monthlyPaymentCop > 0);

  function canAdvance(fromStep: number): boolean {
    if (fromStep === 0) return step1Complete;
    if (fromStep === 1) return step2Complete;
    if (fromStep === 2) return step3Complete;
    return true;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stepper */}
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-4 h-0.5 w-full bg-border" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-brand transition-all"
          style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((label, index) => (
          <div key={label} className="relative z-10 flex flex-col items-center gap-2 bg-bg px-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                index < step
                  ? "border-brand bg-brand text-text-inverse"
                  : index === step
                    ? "border-brand bg-brand text-text-inverse"
                    : "border-border bg-bg text-text-muted"
              }`}
            >
              {index < step ? <Icon name="checkCircle" size={16} /> : index + 1}
            </div>
            <span className={`text-center text-[11px] font-medium ${index === step ? "text-text" : "text-text-muted"}`}>{label}</span>
          </div>
        ))}
      </div>

      {selectedEquipment ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm">
          <span className="font-medium text-text">
            {selectedEquipment.name} — {formatCop(selectedEquipment.priceCop)}
          </span>
          {step > 0 ? (
            <button type="button" onClick={() => setStep(0)} className="text-xs font-semibold text-brand hover:underline">
              Cambiar
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Paso 1: Equipo */}
      {step === 0 ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-text">¿Qué equipo estás evaluando?</h2>

          {isLoggedIn && equipment.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Elige de tu catálogo o ingresa un precio manual.</span>
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
                          {eq.name} — {formatCop(eq.priceCop)}
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
            </>
          ) : (
            <p className="rounded-lg border border-border bg-bg-alt p-4 text-sm text-text-muted">
              <Link href="/login" className="font-medium text-brand hover:underline">
                Inicia sesión
              </Link>{" "}
              para elegir un equipo real del catálogo y autocompletar su precio. Mientras tanto, puedes ingresarlo manualmente.
            </p>
          )}

          {mode === "manual" || !isLoggedIn || equipment.length === 0 ? (
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
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Paso 2: Datos del taller */}
      {step === 1 ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-text">Cuéntanos sobre tu taller</h2>
          <p className="text-sm text-text-muted">Estos datos se usan para calcular tu proyección.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
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
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
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
                className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Paso 3: Forma de pago */}
      {step === 2 ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-text">¿Cómo planeas adquirir el equipo?</h2>
          <div className="flex gap-2 rounded-lg border border-border bg-bg-alt p-1">
            <button
              type="button"
              onClick={() => setPaymentMethod("contado")}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                paymentMethod === "contado" ? "bg-brand text-text-inverse" : "text-text-muted hover:text-text"
              }`}
            >
              Pago de contado
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("financiado")}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                paymentMethod === "financiado" ? "bg-brand text-text-inverse" : "text-text-muted hover:text-text"
              }`}
            >
              Financiado (con tu banco)
            </button>
          </div>

          {paymentMethod === "contado" ? (
            <p className="text-sm text-text-muted">
              Pagas el valor total del equipo de una vez. Si el precio supera el umbral de cotización, tu compra se gestiona como
              solicitud de cotización en vez de pago directo.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="rounded-lg border border-border bg-bg-alt p-3 text-xs text-text-muted">
                Tecni no ofrece financiación propia — ingresa las condiciones reales que te dé tu banco o entidad financiera.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="loanAmountCop" className="text-sm text-text-muted">
                    Valor a financiar (COP)
                  </label>
                  <input
                    id="loanAmountCop"
                    type="number"
                    min={0}
                    value={loanAmountCop}
                    onChange={(e) => setLoanAmountCop(e.target.value)}
                    placeholder={equipmentPriceCop || undefined}
                    className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="annualInterestRatePercent" className="text-sm text-text-muted">
                    Tasa de interés anual (%)
                  </label>
                  <input
                    id="annualInterestRatePercent"
                    type="number"
                    min={0}
                    step="0.1"
                    value={annualInterestRatePercent}
                    onChange={(e) => setAnnualInterestRatePercent(e.target.value)}
                    className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="termMonths" className="text-sm text-text-muted">
                    Plazo (meses)
                  </label>
                  <input
                    id="termMonths"
                    type="number"
                    min={1}
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value)}
                    className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {loanResult ? (
                <div className="rounded-lg border border-border bg-bg-alt p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Cuota mensual estimada</span>
                    <span className="font-semibold text-text">{formatCop(loanResult.monthlyPaymentCop)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Intereses totales del plazo</span>
                    <span className="font-semibold text-text">{formatCop(loanResult.totalInterestCop)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* Paso 4: Resultados */}
      {step === 3 ? (
        <div className="flex flex-col gap-6">
          {roiResult ? (
            <div className="rounded-lg border border-border bg-surface p-6">
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-muted">Utilidad neta por servicio</dt>
                  <dd className="font-semibold text-text">{formatCop(roiResult.netProfitPerServiceCop)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Utilidad mensual estimada</dt>
                  <dd className="font-semibold text-text">{formatCop(roiResult.monthlyProfitCop)}</dd>
                </div>

                {paymentMethod === "contado" ? (
                  <div className="flex justify-between border-t border-border pt-2">
                    <dt className="text-text-muted">Meses para recuperar la inversión</dt>
                    <dd className="text-lg font-bold text-brand">
                      {roiResult.monthsToBreakEven !== null ? `${roiResult.monthsToBreakEven.toFixed(1)} meses` : "No se recupera con estos datos"}
                    </dd>
                  </div>
                ) : loanResult ? (
                  <>
                    <div className="flex justify-between border-t border-border pt-2">
                      <dt className="text-text-muted">Cuota mensual del préstamo</dt>
                      <dd className="font-semibold text-text">{formatCop(loanResult.monthlyPaymentCop)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Flujo neto mensual (utilidad − cuota)</dt>
                      <dd className={`text-lg font-bold ${monthlyNetCashflow !== null && monthlyNetCashflow >= 0 ? "text-success" : "text-danger"}`}>
                        {monthlyNetCashflow !== null ? formatCop(monthlyNetCashflow) : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Intereses totales del plazo</dt>
                      <dd className="font-semibold text-text">{formatCop(loanResult.totalInterestCop)}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Completa los pasos anteriores para ver el resultado.</p>
          )}
          <p className="text-xs text-text-muted">
            * Estimación basada exclusivamente en los datos que ingresaste. No es una garantía de ingresos ni una oferta financiera.
          </p>
        </div>
      ) : null}

      {/* Navegación */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-[var(--radius)] border-2 border-text px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-alt disabled:cursor-not-allowed disabled:opacity-40"
        >
          Atrás
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canAdvance(step)}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-brand px-8 py-3 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuar
            <Icon name="arrowRight" size={18} />
          </button>
        ) : (
          <Link
            href="/catalogo"
            className="flex items-center gap-2 rounded-[var(--radius)] bg-brand px-8 py-3 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Ver catálogo
            <Icon name="arrowRight" size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}
