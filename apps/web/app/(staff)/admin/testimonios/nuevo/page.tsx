import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@tecni/ui";

import { SubmitButton } from "@/components/submit-button";

import { createTestimonialAction } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo testimonio — Panel maestro",
};

const inputClass = "rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none";

export default async function NuevoTestimonioPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/testimonios" className="hover:text-brand">
          Testimonios
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-text">Nuevo testimonio</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-text">Nuevo testimonio</h1>
        <p className="text-sm text-text-muted">Solo testimonios reales de clientes reales — nunca un texto de ejemplo.</p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      <form action={createTestimonialAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="authorName" className="text-sm font-medium text-text-muted">
            Nombre del cliente
          </label>
          <input id="authorName" name="authorName" required placeholder="Ej: Carlos Ramírez" className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="company" className="text-sm font-medium text-text-muted">
              Empresa (opcional)
            </label>
            <input id="company" name="company" placeholder="Ej: Taller El Motor" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium text-text-muted">
              Cargo (opcional)
            </label>
            <input id="role" name="role" placeholder="Ej: Gerente de taller" className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="quote" className="text-sm font-medium text-text-muted">
            Testimonio
          </label>
          <textarea id="quote" name="quote" required rows={4} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="position" className="text-sm font-medium text-text-muted">
              Orden
            </label>
            <input id="position" name="position" type="number" defaultValue={0} className={inputClass} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="isActive" name="isActive" type="checkbox" value="1" defaultChecked className="h-4 w-4" />
            <label htmlFor="isActive" className="text-sm text-text">
              Activo (visible en el home)
            </label>
          </div>
        </div>

        <SubmitButton
          pendingLabel="Creando…"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          Crear testimonio
        </SubmitButton>
      </form>
    </div>
  );
}
