import type { Metadata } from "next";

import { createBrandAction } from "../actions";

export const metadata: Metadata = {
  title: "Nueva marca — Panel maestro",
};

export default async function NuevaMarcaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Nueva marca</h1>

      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={createBrandAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-text-muted">
            Nombre
          </label>
          <input id="name" name="name" required className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
          <p className="text-xs text-text-muted">La URL de la marca (slug) se genera sola a partir de este nombre.</p>
        </div>

        <p className="text-sm text-text-muted">El logo se sube después de crear la marca, desde su ficha.</p>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked /> Activa
        </label>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Crear marca
        </button>
      </form>
    </div>
  );
}
