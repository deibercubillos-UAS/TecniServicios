import { describe, expect, it } from "vitest";
import { formatCop } from "./format-cop";

const NBSP = " ";

describe("formatCop", () => {
  it("formatea con símbolo y sin decimales", () => {
    expect(formatCop(5000000)).toBe(`$${NBSP}5.000.000`);
  });

  it("redondea a entero", () => {
    expect(formatCop(1234.9)).toBe(`$${NBSP}1.235`);
  });
});
