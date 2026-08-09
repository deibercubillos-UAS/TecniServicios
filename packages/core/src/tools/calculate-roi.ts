export interface RoiInput {
  equipmentPriceCop: number;
  servicesPerMonth: number;
  revenuePerServiceCop: number;
  costPerServiceCop: number;
}

export interface RoiResult {
  netProfitPerServiceCop: number;
  monthlyProfitCop: number;
  monthsToBreakEven: number | null;
}

/**
 * Retorno de inversión de un equipo por número de servicios al mes —
 * `packages/core` porque es la única lógica de negocio real detrás de
 * "Calcula tu rentabilidad" en el navbar público. Sin sesión ni base de
 * datos: cálculo puro sobre lo que el usuario ingresa.
 *
 * `monthsToBreakEven` es `null` cuando la utilidad mensual es cero o
 * negativa — no hay un número de meses real que mostrar (dividir por
 * cero o dar un resultado negativo sería inventar un dato).
 */
export function calculateRoi(input: RoiInput): RoiResult {
  const netProfitPerServiceCop = input.revenuePerServiceCop - input.costPerServiceCop;
  const monthlyProfitCop = netProfitPerServiceCop * input.servicesPerMonth;
  const monthsToBreakEven = monthlyProfitCop > 0 ? input.equipmentPriceCop / monthlyProfitCop : null;

  return { netProfitPerServiceCop, monthlyProfitCop, monthsToBreakEven };
}
