import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { AnnouncementIconPicker } from "@/components/announcement-icon-picker";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FileSizeGuardForm } from "@/components/file-size-guard-form";
import { LinkUrlField } from "@/components/link-url-field";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { BANNER_PLACEMENT_GROUPS, BANNER_PLACEMENT_LABEL } from "@/lib/banner-placement";
import { SITE_PAGES } from "@/lib/site-pages";

import { deleteBannerAction, deleteBannerMobileImageAction, updateBannerAction, uploadBannerImageAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar banner — Panel maestro",
};

interface BannerRow {
  id: string;
  title: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  icon: string | null;
  category_id: string | null;
  position: number;
  placement: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export default async function EditarBannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; created?: string; updated?: string; imageUploaded?: string; mobileImageDeleted?: string }>;
}) {
  const { id } = await params;
  const { error, created, updated, imageUploaded, mobileImageDeleted } = await searchParams;
  const supabase = await getSupabase();

  const [{ data: bannerData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("banners")
      .select("id,title,image_url,mobile_image_url,link_url,icon,category_id,position,placement,starts_at,ends_at,is_active")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id,slug,name").order("name"),
  ]);
  const banner = bannerData as BannerRow | null;
  const categoriesRows = (categoriesData as { id: string; slug: string; name: string }[] | null) ?? [];
  const categoryOptions = categoriesRows.map((c) => ({
    value: `/catalogo?categoria=${c.slug}`,
    label: c.name,
  }));
  const categoryIdOptions = categoriesRows.map((c) => ({ id: c.id, name: c.name }));

  if (!banner) {
    return (
      <div className="mx-auto max-w-[700px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Banner no encontrado</h1>
        <Link href="/admin/banners" className="text-brand hover:underline">
          Ver banners
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <nav aria-label="Miga de pan" className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/banners" className="hover:text-brand">
          Banners
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="truncate text-text">{banner.title ?? "(sin título)"}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text">{banner.title ?? "(sin título)"}</h1>
          <p className="text-sm text-text-muted">
            {BANNER_PLACEMENT_LABEL[banner.placement] ?? banner.placement} · posición {banner.position}
          </p>
        </div>
        {banner.is_active ? (
          <StatusBadge label="Activo" tone="success" icon="checkCircle" />
        ) : (
          <StatusBadge label="Inactivo" tone="muted" icon="close" />
        )}
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Banner creado.
        </p>
      ) : null}
      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Banner actualizado.
        </p>
      ) : null}
      {imageUploaded ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Imagen actualizada.
        </p>
      ) : null}
      {mobileImageDeleted ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Imagen móvil eliminada.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      {banner.placement !== "announcement_bar" ? (
        <>
          <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-bold text-text">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                <Icon name="image" size={16} />
              </span>
              Imagen de escritorio
            </h2>
            {banner.image_url ? (
              <img src={banner.image_url} alt="" className="h-40 w-full max-w-md rounded-[var(--radius)] object-cover" />
            ) : (
              <p className="text-sm text-text-muted">Sin imagen todavía.</p>
            )}

            <FileSizeGuardForm action={uploadBannerImageAction} maxMB={4} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="bannerId" value={banner.id} />
                <input type="hidden" name="kind" value="desktop" />
                <input type="file" name="image" accept="image/*" required aria-label="Reemplazar imagen de escritorio" className="text-sm text-text" />
                <SubmitButton
                  pendingLabel="Subiendo…"
                  className="rounded-[var(--radius)] bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
                >
                  Reemplazar
                </SubmitButton>
              </div>
              <p className="text-xs text-text-muted">Máximo 4 MB.</p>
            </FileSizeGuardForm>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-bold text-text">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                <Icon name="image" size={16} />
              </span>
              Imagen móvil
            </h2>
            <p className="text-sm text-text-muted">Opcional — si no la subes, se usa la de escritorio también en móvil.</p>

            {banner.mobile_image_url ? (
              <img src={banner.mobile_image_url} alt="" className="h-40 w-auto max-w-xs rounded-[var(--radius)] object-cover" />
            ) : (
              <p className="text-sm text-text-muted">Sin imagen móvil todavía.</p>
            )}

            <FileSizeGuardForm action={uploadBannerImageAction} maxMB={4} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="bannerId" value={banner.id} />
                <input type="hidden" name="kind" value="mobile" />
                <input type="file" name="image" accept="image/*" required aria-label="Subir imagen móvil" className="text-sm text-text" />
                <SubmitButton
                  pendingLabel="Subiendo…"
                  className="rounded-[var(--radius)] bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
                >
                  {banner.mobile_image_url ? "Reemplazar" : "Subir"}
                </SubmitButton>
              </div>
              <p className="text-xs text-text-muted">Máximo 4 MB.</p>
            </FileSizeGuardForm>

            {banner.mobile_image_url ? (
              <form action={deleteBannerMobileImageAction} className="w-fit">
                <input type="hidden" name="bannerId" value={banner.id} />
                <button type="submit" className="text-sm font-medium text-danger hover:underline">
                  Eliminar imagen móvil
                </button>
              </form>
            ) : null}
          </section>
        </>
      ) : null}

      <form action={updateBannerAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="bannerId" value={banner.id} />
        <h2 className="flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="document" size={16} />
          </span>
          Datos básicos
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium text-text-muted">
            Título (opcional)
          </label>
          <input
            id="title"
            name="title"
            defaultValue={banner.title ?? ""}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-muted">Enlace (opcional)</label>
          <LinkUrlField
            pages={SITE_PAGES.map((p) => ({ value: p.value, label: p.label }))}
            categories={categoryOptions}
            defaultValue={banner.link_url ?? ""}
          />
        </div>

        {banner.placement === "announcement_bar" ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-muted">Ícono</label>
            <AnnouncementIconPicker defaultValue={banner.icon ?? "bolt"} />
            <p className="text-xs text-text-muted">La franja de anuncio no muestra imagen — elige un ícono en su lugar.</p>
          </div>
        ) : null}

        {banner.placement === "category_hero" ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="categoryId" className="text-sm font-medium text-text-muted">
              Categoría
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={banner.category_id ?? ""}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Elige una categoría</option>
              {categoryIdOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted">
              Si cambias la ubicación a "Hero de categoría", guarda primero — el selector de categoría aparece después de recargar.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="placement" className="text-sm font-medium text-text-muted">
              Ubicación
            </label>
            <select
              id="placement"
              name="placement"
              defaultValue={banner.placement}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {BANNER_PLACEMENT_GROUPS.map((group) => (
                <option key={group.placement} value={group.placement}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="position" className="text-sm font-medium text-text-muted">
              Posición
            </label>
            <input
              id="position"
              name="position"
              type="number"
              min={0}
              defaultValue={banner.position}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="startsAt" className="text-sm font-medium text-text-muted">
              Vigente desde (opcional)
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(banner.starts_at)}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="endsAt" className="text-sm font-medium text-text-muted">
              Vigente hasta (opcional)
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(banner.ends_at)}
              className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked={banner.is_active} className="mt-0.5" />
          <span>
            <span className="font-medium">Activo</span>
            <span className="block text-xs text-text-muted">Visible en el sitio. Desmárcalo para ocultarlo sin eliminarlo.</span>
          </span>
        </label>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Guardar cambios
        </button>
      </form>

      <section className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/5 p-5">
        <h2 className="flex items-center gap-2 font-bold text-danger">
          <Icon name="trash" size={16} />
          Zona de peligro
        </h2>
        <p className="text-sm text-text-muted">Elimina el banner por completo. No se puede deshacer.</p>
        <form action={deleteBannerAction} className="w-fit">
          <input type="hidden" name="bannerId" value={banner.id} />
          <ConfirmSubmitButton
            confirmMessage={`¿Eliminar el banner "${banner.title ?? "(sin título)"}"? No se puede deshacer.`}
            className="rounded-[var(--radius)] border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            Eliminar banner
          </ConfirmSubmitButton>
        </form>
      </section>

      <Link href="/admin/banners" className="text-sm text-brand hover:underline">
        Ver banners
      </Link>
    </div>
  );
}
