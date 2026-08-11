import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Garantía",
  description: "Política de garantía de los equipos y repuestos vendidos por Tecni Equipos y Servicios SAS.",
};

export default function GarantiaPage() {
  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="rounded-[var(--radius)] border border-warning bg-warning/10 px-4 py-3 text-sm text-warning">
        <strong>Borrador.</strong> Este texto está sujeto a revisión legal antes de publicarse en producción. No constituye
        asesoría jurídica.
      </div>

      <h1 className="text-2xl font-bold text-text">Garantía</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">1. Cobertura</h2>
        <p className="text-sm text-text">
          Cada equipo serializado que compras queda registrado en tu cuenta con su garantía asociada, cuando aplica —
          consultable desde{" "}
          <Link href="/mi-cuenta/equipos" className="text-brand hover:underline">
            Mi cuenta → Equipos
          </Link>
          . La duración de la garantía la define el fabricante o distribuidor de cada producto, no es uniforme para todo
          el catálogo.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">2. Qué cubre</h2>
        <p className="text-sm text-text">
          Defectos de fabricación bajo uso normal, conforme a las condiciones que indique el fabricante en la ficha técnica
          del equipo. No cubre daños por mal uso, desgaste normal de piezas de consumo, ni intervención por personal no
          autorizado.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">3. Cómo hacer válida la garantía</h2>
        <p className="text-sm text-text">
          Abre un ticket de soporte desde{" "}
          <Link href="/mi-cuenta/tickets" className="text-brand hover:underline">
            Mi cuenta → Tickets
          </Link>{" "}
          referenciando el equipo. Un técnico evalúa el caso y coordina el mantenimiento o reemplazo que corresponda.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">4. Mantenimiento preventivo</h2>
        <p className="text-sm text-text">
          Agendar el mantenimiento recomendado del equipo (cuando aplica) es responsabilidad del comprador y puede ser
          condición para mantener la garantía vigente, según lo que indique el fabricante.
        </p>
      </section>
    </div>
  );
}
