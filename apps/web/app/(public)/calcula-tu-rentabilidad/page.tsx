import type { Metadata } from "next";

import { RoiCalculator } from "@/components/roi-calculator";

export const metadata: Metadata = {
  title: "Calcula tu rentabilidad — Tecni Equipos y Servicios SAS",
  description: "Estima en cuántos meses se paga solo un equipo según cuántos servicios haces al mes.",
};

export default function CalculaTuRentabilidadPage() {
  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Calcula tu rentabilidad</h1>
        <p className="text-sm text-text-muted">
          Estima en cuántos meses un equipo se paga solo, según cuántos servicios haces al mes y cuánto ganas por cada uno.
        </p>
      </div>
      <RoiCalculator />
    </div>
  );
}
