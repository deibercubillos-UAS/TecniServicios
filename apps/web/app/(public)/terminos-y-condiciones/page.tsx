import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y condiciones — Tecni Equipos y Servicios SAS",
  description: "Términos y condiciones de uso de la plataforma de Tecni Equipos y Servicios SAS.",
};

export default function TerminosCondicionesPage() {
  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="rounded-[var(--radius)] border border-warning bg-warning/10 px-4 py-3 text-sm text-warning">
        <strong>Borrador.</strong> Este texto está sujeto a revisión legal antes de publicarse en producción. No constituye
        asesoría jurídica.
      </div>

      <h1 className="text-2xl font-bold text-text">Términos y condiciones</h1>
      <p className="text-sm text-text-muted">Aplican al uso de esta plataforma por parte de empresas registradas.</p>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">1. Naturaleza de la plataforma</h2>
        <p className="text-sm text-text">
          Este es un portal comercial B2B: el catálogo, los precios y las cotizaciones están reservados a empresas
          registradas. Un visitante sin sesión puede ver el catálogo y las especificaciones, pero no los precios.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">2. Cuenta y empresa</h2>
        <p className="text-sm text-text">
          Cada usuario pertenece a una empresa identificada por su NIT. Los pedidos, cotizaciones, equipos y facturas
          pertenecen a la empresa, no a la persona que los gestiona. El usuario es responsable de la veracidad de los datos
          que registra.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">3. Precios y cotizaciones</h2>
        <p className="text-sm text-text">
          Los precios provienen de nuestro sistema de gestión comercial y pueden cambiar sin previo aviso hasta el momento
          del pago. Los productos por debajo de un umbral configurable se compran directamente; los que lo superan requieren
          una cotización asistida por un vendedor. Si nuestro sistema de precios no responde, mostramos el último precio
          conocido marcado como "sujeto a confirmación".
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">4. Pagos</h2>
        <p className="text-sm text-text">
          Los pagos se procesan a través de una pasarela de pagos externa. Ver la{" "}
          <Link href="/envios-y-devoluciones" className="text-brand hover:underline">
            política de envíos y devoluciones
          </Link>{" "}
          y la{" "}
          <Link href="/garantia" className="text-brand hover:underline">
            política de garantía
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">5. Uso aceptable</h2>
        <p className="text-sm text-text">
          No está permitido usar la plataforma para actividades fraudulentas, intentar acceder a datos de otra empresa, o
          automatizar solicitudes fuera de lo previsto por la API pública.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">6. Datos personales</h2>
        <p className="text-sm text-text">
          Ver la{" "}
          <Link href="/politica-de-tratamiento-de-datos" className="text-brand hover:underline">
            política de tratamiento de datos
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">7. Contacto</h2>
        <p className="text-sm text-text">
          Preguntas sobre estos términos:{" "}
          <Link href="/contacto" className="text-brand hover:underline">
            formulario de contacto
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
