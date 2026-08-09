import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { updateBannerAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar banner — Panel maestro",
};

interface BannerRow {
  id: string;
  title: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
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
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: bannerData } = await supabase
    .from("banners")
    .select("id,title,image_url,mobile_image_url,link_url,position,placement,starts_at,ends_at,is_active")
    .eq("id", id)
    .maybeSingle();
  const banner = bannerData as BannerRow | null;

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
      <h1 className="text-2xl font-bold text-text">{banner.title ?? "(sin título)"}</h1>

      {updated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Banner actualizado.</p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <form action={updateBannerAction} className="flex flex-col gap-4">
        <input type="hidden" name="bannerId" value={banner.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm text-text-muted">
            Título (opcional)
          </label>
          <input id="title" name="title" defaultValue={banner.title ?? ""} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="imageUrl" className="text-sm text-text-muted">
            URL de imagen
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            required
            defaultValue={banner.image_url}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="mobileImageUrl" className="text-sm text-text-muted">
            URL de imagen móvil (opcional)
          </label>
          <input
            id="mobileImageUrl"
            name="mobileImageUrl"
            type="url"
            defaultValue={banner.mobile_image_url ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="linkUrl" className="text-sm text-text-muted">
            Enlace (opcional)
          </label>
          <input
            id="linkUrl"
            name="linkUrl"
            type="url"
            defaultValue={banner.link_url ?? ""}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="placement" className="text-sm text-text-muted">
              Placement
            </label>
            <select id="placement" name="placement" defaultValue={banner.placement} className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm">
              <option value="home_hero">Home hero</option>
              <option value="catalog_top">Catálogo (arriba)</option>
              <option value="announcement_bar">Franja de anuncio (navbar)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="position" className="text-sm text-text-muted">
              Posición
            </label>
            <input
              id="position"
              name="position"
              type="number"
              min={0}
              defaultValue={banner.position}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="startsAt" className="text-sm text-text-muted">
              Vigente desde (opcional)
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(banner.starts_at)}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="endsAt" className="text-sm text-text-muted">
              Vigente hasta (opcional)
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(banner.ends_at)}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isActive" value="1" defaultChecked={banner.is_active} /> Activo
        </label>

        <button
          type="submit"
          className="self-start rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Guardar cambios
        </button>
      </form>

      <Link href="/admin/banners" className="text-sm text-brand hover:underline">
        Ver banners
      </Link>
    </div>
  );
}
