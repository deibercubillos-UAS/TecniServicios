import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sin permiso — Tecni Equipos y Servicios SAS",
};

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-text">No tenés permiso para ver esta página</h1>
      <p className="text-sm text-text-muted">
        Si creés que esto es un error, contactá a tu administrador.
      </p>
      <Link
        href="/"
        className="rounded-[var(--radius)] bg-brand px-4 py-2 font-medium text-text-inverse transition-colors hover:bg-brand-hover"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
