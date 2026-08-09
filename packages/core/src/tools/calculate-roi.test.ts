import { describe, expect, it } from "vitest";

import { calculateRoi } from "./calculate-roi";

describe("calculateRoi", () => {
  it("computes months to break even with a positive monthly profit", () => {
    const result = calculateRoi({
      equipmentPriceCop: 12_000_000,
      servicesPerMonth: 20,
      revenuePerServiceCop: 100_000,
      costPerServiceCop: 40_000,
    });
    expect(result.netProfitPerServiceCop).toBe(60_000);
    expect(result.monthlyProfitCop).toBe(1_200_000);
    expect(result.monthsToBreakEven).toBe(10);
  });

  it("returns null months when the monthly profit is zero", () => {
    const result = calculateRoi({
      equipmentPriceCop: 5_000_000,
      servicesPerMonth: 10,
      revenuePerServiceCop: 50_000,
      costPerServiceCop: 50_000,
    });
    expect(result.monthlyProfitCop).toBe(0);
    expect(result.monthsToBreakEven).toBeNull();
  });

  it("returns null months when the monthly profit is negative", () => {
    const result = calculateRoi({
      equipmentPriceCop: 5_000_000,
      servicesPerMonth: 10,
      revenuePerServiceCop: 30_000,
      costPerServiceCop: 50_000,
    });
    expect(result.monthlyProfitCop).toBeLessThan(0);
    expect(result.monthsToBreakEven).toBeNull();
  });

  it("handles zero services per month", () => {
    const result = calculateRoi({
      equipmentPriceCop: 5_000_000,
      servicesPerMonth: 0,
      revenuePerServiceCop: 100_000,
      costPerServiceCop: 40_000,
    });
    expect(result.monthlyProfitCop).toBe(0);
    expect(result.monthsToBreakEven).toBeNull();
  });
});
