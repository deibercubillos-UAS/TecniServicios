import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Envíos y devoluciones — Tecni Equipos y Servicios SAS",
  description: "Política de envíos y devoluciones de Tecni Equipos y Servicios SAS.",
};

export default function EnviosDevolucionesPage() {
  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="rounded-[var(--radius)] border border-warning bg-warning/10 px-4 py-3 text-sm text-warning">
        <strong>Borrador.</strong> Este texto está sujeto a revisión legal antes de publicarse en producción. No constituye
        asesoría jurídica.
      </div>

      <h1 className="text-2xl font-bold text-text">Envíos y devoluciones</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">1. Envíos</h2>
        <p className="text-sm text-text">
          Una vez confirmado el pago, tu pedido pasa a preparación y luego a envío. Cuando se despacha, registramos la
          transportadora y el número de guía en el detalle del pedido — consultable desde{" "}
          <Link href="/pedidos" className="text-brand hover:underline">
            Mis pedidos
          </Link>
          . El tiempo de entrega depende de la transportadora y la ciudad de destino.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">2. Recepción</h2>
        <p className="text-sm text-text">
          Al recibir un equipo serializado, este queda registrado en tu cuenta y habilita su historial de postventa
          (manual, mantenimiento, garantía). Revisa el equipo al recibirlo y reporta cualquier daño de transporte de
          inmediato por un ticket de soporte.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">3. Devoluciones</h2>
        <p className="text-sm text-text">
          Para solicitar una devolución o cambio, abre un ticket de soporte desde{" "}
          <Link href="/mi-cuenta/tickets" className="text-brand hover:underline">
            Mi cuenta → Tickets
          </Link>{" "}
          indicando el número de pedido y el motivo. Un vendedor evalúa el caso según el producto y su estado.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">4. Cotizaciones asistidas</h2>
        <p className="text-sm text-text">
          Los equipos por encima del umbral de cotización no se compran directamente — se coordinan con un vendedor, que
          define junto contigo las condiciones de entrega en la cotización misma.
        </p>
      </section>
    </div>
  );
}
