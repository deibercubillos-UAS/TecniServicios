import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Icon, buttonClass } from "@tecni/ui";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center bg-bg-inverse">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-subtle">
          <Icon name="search" size={36} className="text-brand" />
        </span>
        <Badge>Error 404</Badge>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-text-inverse md:text-4xl">
          No encontramos esta página
        </h1>
        <p className="max-w-md text-text-inverse-muted">
          El enlace puede estar roto o la página se movió. Revisa el catálogo completo o vuelve al inicio.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/" className={buttonClass("primary")}>
            Volver al inicio
            <Icon name="arrowRight" size={18} />
          </Link>
          <Link href="/catalogo" className={buttonClass("secondary")}>
            Ver catálogo completo
          </Link>
        </div>
      </div>
    </main>
  );
}
