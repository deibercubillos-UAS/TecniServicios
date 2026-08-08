import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolvePrice } from "./resolve-price";

const hoursAgo = (hours: number): string => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

describe("resolvePrice", () => {
  it("sin sesión (userId nulo): nunca hay precio", () => {
    const result = resolvePrice(
      { priceCop: 1_000_000, priceSyncedAt: hoursAgo(1) },
      { userId: null },
    );
    expect(result).toEqual({ visible: false });
  });

  it("con sesión y precio reciente (< 6h): visible y confirmado", () => {
    const result = resolvePrice(
      { priceCop: 1_000_000, priceSyncedAt: hoursAgo(1) },
      { userId: "user-1" },
    );
    expect(result).toEqual({ visible: true, priceCop: 1_000_000, confidence: "confirmed" });
  });

  it("con sesión y precio de 6-48h: visible pero sin confirmar", () => {
    const result = resolvePrice(
      { priceCop: 1_000_000, priceSyncedAt: hoursAgo(24) },
      { userId: "user-1" },
    );
    expect(result).toEqual({ visible: true, priceCop: 1_000_000, confidence: "unconfirmed" });
  });

  it("con sesión y precio de más de 48h: se oculta", () => {
    const result = resolvePrice(
      { priceCop: 1_000_000, priceSyncedAt: hoursAgo(49) },
      { userId: "user-1" },
    );
    expect(result).toEqual({ visible: false });
  });

  it("sin price_cop o sin price_synced_at: se oculta aunque haya sesión", () => {
    expect(resolvePrice({ priceCop: null, priceSyncedAt: hoursAgo(1) }, { userId: "user-1" })).toEqual({
      visible: false,
    });
    expect(resolvePrice({ priceCop: 1_000_000, priceSyncedAt: null }, { userId: "user-1" })).toEqual({
      visible: false,
    });
  });

  describe("límites exactos (reloj congelado)", () => {
    // `hoursAgo()` y el `Date.now()` interno de `resolvePrice` deben leer el
    // mismo instante — sin congelar el reloj, el tiempo real transcurrido
    // entre ambas llamadas (aunque sea de milisegundos) empuja la edad justo
    // encima del límite y el test se vuelve intermitente.
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("exactamente en el límite de 6h cuenta como confirmado (no estricto)", () => {
      const result = resolvePrice(
        { priceCop: 1_000_000, priceSyncedAt: hoursAgo(6) },
        { userId: "user-1" },
      );
      expect(result).toEqual({ visible: true, priceCop: 1_000_000, confidence: "confirmed" });
    });

    it("exactamente en el límite de 48h todavía es visible (no estricto)", () => {
      const result = resolvePrice(
        { priceCop: 1_000_000, priceSyncedAt: hoursAgo(48) },
        { userId: "user-1" },
      );
      expect(result.visible).toBe(true);
    });
  });
});
