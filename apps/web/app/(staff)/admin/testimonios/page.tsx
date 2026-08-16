import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StatusBadge } from "@/components/status-badge";

import { deleteTestimonialAction } from "./actions";

export const metadata: Metadata = {
  title: "Testimonios — Panel maestro",
};

interface TestimonialRow {
  id: string;
  author_name: string;
  company: string | null;
  quote: string;
  is_active: boolean;
  position: number;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminTestimoniosPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string }>;
}) {
  const { created, updated, deleted } = await searchParams;
  const supabase = await getSupabase();

  const { data } = await supabase
    .from("testimonials")
    .select("id,author_name,company,quote,is_active,position")
    .order("position");
  const testimonials = (data as TestimonialRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text">Testimonios</h1>
          <p className="text-sm text-text-muted">Solo testimonios reales de clientes — se muestran en el home cuando hay al menos uno activo.</p>
        </div>
        <Link
          href="/admin/testimonios/nuevo"
          className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Nuevo testimonio
        </Link>
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Testimonio creado.
        </p>
      ) : null}
      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Testimonio actualizado.
        </p>
      ) : null}
      {deleted ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Testimonio eliminado.
        </p>
      ) : null}

      {testimonials.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="star" size={26} />
          </span>
          <p className="font-semibold text-text">Sin testimonios todavía.</p>
          <p className="text-sm text-text-muted">La sección de testimonios está oculta en el home hasta que agregues el primero.</p>
          <Link href="/admin/testimonios/nuevo" className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-hover">
            Crear el primer testimonio
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {testimonials.map((testimonial) => (
            <li key={testimonial.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <Link href={`/admin/testimonios/${testimonial.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium text-text hover:text-brand">
                  {testimonial.author_name}
                  {testimonial.company ? <span className="text-text-muted"> · {testimonial.company}</span> : null}
                </p>
                <p className="truncate text-xs text-text-muted">{testimonial.quote}</p>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                {testimonial.is_active ? (
                  <StatusBadge label="Activo" tone="success" icon="checkCircle" />
                ) : (
                  <StatusBadge label="Inactivo" tone="muted" icon="close" />
                )}
                <form action={deleteTestimonialAction}>
                  <input type="hidden" name="testimonialId" value={testimonial.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`¿Eliminar el testimonio de "${testimonial.author_name}"? No se puede deshacer.`}
                    title="Eliminar testimonio"
                    aria-label={`Eliminar testimonio de ${testimonial.author_name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <Icon name="trash" size={16} />
                  </ConfirmSubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
