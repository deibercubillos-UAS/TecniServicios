import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

import { deleteTestimonialAction, updateTestimonialAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar testimonio — Panel maestro",
};

interface TestimonialRow {
  id: string;
  author_name: string;
  company: string | null;
  role: string | null;
  quote: string;
  is_active: boolean;
  position: number;
}

const inputClass = "rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function EditarTestimonioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data } = await supabase
    .from("testimonials")
    .select("id,author_name,company,role,quote,is_active,position")
    .eq("id", id)
    .maybeSingle();
  const testimonial = data as TestimonialRow | null;

  if (!testimonial) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/testimonios" className="hover:text-brand">
          Testimonios
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-text">{testimonial.author_name}</span>
      </nav>

      <h1 className="text-2xl font-bold text-text">{testimonial.author_name}</h1>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}
      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Testimonio actualizado.
        </p>
      ) : null}

      <form action={updateTestimonialAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="testimonialId" value={testimonial.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="authorName" className="text-sm font-medium text-text-muted">
            Nombre del cliente
          </label>
          <input id="authorName" name="authorName" required defaultValue={testimonial.author_name} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="company" className="text-sm font-medium text-text-muted">
              Empresa (opcional)
            </label>
            <input id="company" name="company" defaultValue={testimonial.company ?? ""} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium text-text-muted">
              Cargo (opcional)
            </label>
            <input id="role" name="role" defaultValue={testimonial.role ?? ""} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="quote" className="text-sm font-medium text-text-muted">
            Testimonio
          </label>
          <textarea id="quote" name="quote" required rows={4} defaultValue={testimonial.quote} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="position" className="text-sm font-medium text-text-muted">
              Orden
            </label>
            <input id="position" name="position" type="number" defaultValue={testimonial.position} className={inputClass} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="isActive" name="isActive" type="checkbox" value="1" defaultChecked={testimonial.is_active} className="h-4 w-4" />
            <label htmlFor="isActive" className="text-sm text-text">
              Activo (visible en el home)
            </label>
          </div>
        </div>

        <SubmitButton
          pendingLabel="Guardando…"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          Guardar cambios
        </SubmitButton>
      </form>

      <form action={deleteTestimonialAction} className="self-start">
        <input type="hidden" name="testimonialId" value={testimonial.id} />
        <ConfirmSubmitButton
          confirmMessage={`¿Eliminar el testimonio de "${testimonial.author_name}"? No se puede deshacer.`}
          className="flex items-center gap-2 rounded-[var(--radius)] border border-danger px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          <Icon name="trash" size={16} />
          Eliminar testimonio
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
