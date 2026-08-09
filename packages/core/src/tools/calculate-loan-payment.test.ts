import { describe, expect, it } from "vitest";
import { calculateLoanPayment } from "./calculate-loan-payment";

describe("calculateLoanPayment", () => {
  it("calcula cuota fija con interés > 0", () => {
    const result = calculateLoanPayment({ principalCop: 10_000_000, annualInterestRatePercent: 24, termMonths: 12 });
    expect(result.monthlyPaymentCop).toBeGreaterThan(10_000_000 / 12);
    expect(result.totalInterestCop).toBeGreaterThan(0);
    expect(result.totalPaidCop).toBeCloseTo(result.monthlyPaymentCop * 12, 5);
  });

  it("sin interés, la cuota es el principal dividido en el plazo", () => {
    const result = calculateLoanPayment({ principalCop: 12_000_000, annualInterestRatePercent: 0, termMonths: 12 });
    expect(result.monthlyPaymentCop).toBeCloseTo(1_000_000, 5);
    expect(result.totalInterestCop).toBeCloseTo(0, 5);
  });

  it("plazo o principal inválidos devuelven ceros, nunca NaN/Infinity", () => {
    expect(calculateLoanPayment({ principalCop: 0, annualInterestRatePercent: 20, termMonths: 12 })).toEqual({
      monthlyPaymentCop: 0,
      totalPaidCop: 0,
      totalInterestCop: 0,
    });
    expect(calculateLoanPayment({ principalCop: 10_000_000, annualInterestRatePercent: 20, termMonths: 0 })).toEqual({
      monthlyPaymentCop: 0,
      totalPaidCop: 0,
      totalInterestCop: 0,
    });
  });
});
