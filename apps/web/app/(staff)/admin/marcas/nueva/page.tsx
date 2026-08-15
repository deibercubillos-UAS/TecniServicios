import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@tecni/ui";

import { SubmitButton } from "@/components/submit-button";

import { createBrandAction } from "../actions";

export const metadata: Metadata = {
  title: "Nueva marca — Panel maestro",
};

export default async function NuevaMarcaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/categorias?seccion=marcas" className="hover:text-brand">
          Categorías y marcas
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-text">Nueva marca</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-text">Nueva marca</h1>
        <p className="text-sm text-text-muted">
          Nace inactiva — no aparece en la franja "Distribuidor autorizado de" hasta que le subas el logo y la
          actives desde su ficha. Al crearla pasas directo a esa ficha.
        </p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <form action={createBrandAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="document" size={16} />
          </span>
          Datos básicos
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-text-muted">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Ej: Corghi"
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <p className="text-xs text-text-muted">La URL de la marca (slug) se genera sola a partir de este nombre.</p>
        </div>

        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-xs text-text-muted">
          <Icon name="image" size={16} className="shrink-0" />
          El logo se sube después de crear la marca, desde su ficha — súbelo antes de activarla.
        </p>

        <label className="flex items-start gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" className="mt-0.5" />
          <span>
            <span className="font-medium">Activa</span>
            <span className="block text-xs text-text-muted">
              Déjala sin marcar por ahora — súbele el logo primero, luego actívala desde su ficha o desde la lista de
              marcas.
            </span>
          </span>
        </label>

        <SubmitButton
          pendingLabel="Creando…"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          Crear y continuar
        </SubmitButton>
      </form>

      <Link href="/admin/categorias?seccion=marcas" className="text-sm text-brand hover:underline">
        Ver marcas
      </Link>
    </div>
  );
}
