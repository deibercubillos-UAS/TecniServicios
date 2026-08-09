import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos — Tecni Equipos y Servicios SAS",
  description: "Cómo Tecni Equipos y Servicios SAS trata los datos personales de sus usuarios, conforme a la Ley 1581 de 2012.",
};

export default function PoliticaTratamientoDatosPage() {
  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="rounded-[var(--radius)] border border-warning bg-warning/10 px-4 py-3 text-sm text-warning">
        <strong>Borrador.</strong> Este texto está sujeto a revisión legal antes de publicarse en producción. No constituye
        asesoría jurídica.
      </div>

      <h1 className="text-2xl font-bold text-text">Política de tratamiento de datos personales</h1>
      <p className="text-sm text-text-muted">Tecni Equipos y Servicios SAS — conforme a la Ley 1581 de 2012 (habeas data).</p>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">1. Responsable del tratamiento</h2>
        <p className="text-sm text-text">Tecni Equipos y Servicios SAS, empresa colombiana de maquinaria y equipos para el sector automotriz.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">2. Datos que recolectamos</h2>
        <p className="text-sm text-text">
          Nombre, teléfono y correo de la persona que se registra; NIT, razón social y dirección de la empresa que representa;
          historial de pedidos, cotizaciones y pagos; equipos adquiridos y su historial de mantenimiento. No recolectamos
          datos sensibles (salud, ideología, biometría) en ningún flujo del producto.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">3. Finalidad</h2>
        <p className="text-sm text-text">
          Ejecutar la relación comercial (cuenta, cotizaciones, pedidos, facturación), dar soporte postventa (mantenimientos,
          tickets, garantía) y cumplir obligaciones fiscales ante la DIAN.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">4. Tus derechos</h2>
        <p className="text-sm text-text">
          Puedes conocer, actualizar y rectificar tus datos, solicitar prueba del consentimiento otorgado, presentar quejas
          ante la Superintendencia de Industria y Comercio, y solicitar la supresión de tus datos cuando no exista un deber
          legal o contractual que lo impida. Ejerce estos derechos desde{" "}
          <Link href="/mi-cuenta/privacidad" className="text-brand hover:underline">
            Mi cuenta → Mis datos personales
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">5. Conservación</h2>
        <p className="text-sm text-text">
          Los datos de facturación (pedidos, pagos, cotizaciones aceptadas) se conservan según la obligación fiscal vigente,
          incluso si solicitas la supresión de tu cuenta — en ese caso anonimizamos tu perfil, no eliminamos el registro
          contable.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">6. Contacto</h2>
        <p className="text-sm text-text">
          Para consultas sobre esta política, escríbenos desde{" "}
          <Link href="/contacto" className="text-brand hover:underline">
            el formulario de contacto
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
