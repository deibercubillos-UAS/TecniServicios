export interface LoanPaymentInput {
  principalCop: number;
  annualInterestRatePercent: number;
  termMonths: number;
}

export interface LoanPaymentResult {
  monthlyPaymentCop: number;
  totalPaidCop: number;
  totalInterestCop: number;
}

/**
 * Amortización francesa estándar (cuota fija). `annualInterestRatePercent`
 * es la tasa que el usuario trae de su banco — la calculadora nunca
 * ofrece ni inventa una tasa propia de Tecni (no existe un producto de
 * financiación real de la empresa, solo pago de contado vía Wompi).
 */
export function calculateLoanPayment(input: LoanPaymentInput): LoanPaymentResult {
  const { principalCop, annualInterestRatePercent, termMonths } = input;
  if (termMonths <= 0 || principalCop <= 0) {
    return { monthlyPaymentCop: 0, totalPaidCop: 0, totalInterestCop: 0 };
  }

  const monthlyRate = annualInterestRatePercent / 100 / 12;
  const monthlyPaymentCop =
    monthlyRate === 0 ? principalCop / termMonths : (principalCop * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

  const totalPaidCop = monthlyPaymentCop * termMonths;
  const totalInterestCop = totalPaidCop - principalCop;

  return { monthlyPaymentCop, totalPaidCop, totalInterestCop };
}
