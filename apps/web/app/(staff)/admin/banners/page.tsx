import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StatusBadge } from "@/components/status-badge";
import { BANNER_PLACEMENT_LABEL } from "@/lib/banner-placement";

import { deleteBannerAction } from "./actions";

export const metadata: Metadata = {
  title: "Banners — Panel maestro",
};

interface BannerRow {
  id: string;
  title: string | null;
  image_url: string;
  placement: string;
  position: number;
  is_active: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminBannersPage({ searchParams }: { searchParams: Promise<{ created?: string; deleted?: string }> }) {
  const { created, deleted } = await searchParams;
  const supabase = await getSupabase();

  const { data: bannersData } = await supabase.from("banners").select("id,title,image_url,placement,position,is_active").order("placement").order("position");
  const banners = (bannersData as BannerRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text">Banners</h1>
          <p className="text-sm text-text-muted">Imágenes destacadas del sitio: home, catálogo y franja de anuncio.</p>
        </div>
        <Link
          href="/admin/banners/nuevo"
          className="flex items-center gap-2 rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          <Icon name="image" size={16} />
          Nuevo banner
        </Link>
      </div>

      {created ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Banner creado.
        </p>
      ) : null}
      {deleted ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Banner eliminado.
        </p>
      ) : null}

      {banners.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-alt px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Icon name="image" size={26} />
          </span>
          <p className="font-semibold text-text">Todavía no hay banners.</p>
          <Link href="/admin/banners/nuevo" className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-hover">
            Crear el primero
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {banners.map((banner) => (
            <li key={banner.id} className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-brand">
              <Link href={`/admin/banners/${banner.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-alt">
                  {banner.placement === "announcement_bar" ? (
                    <Icon name="chat" size={20} className="text-text-muted" />
                  ) : (
                    <img src={banner.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text group-hover:text-brand">{banner.title ?? "(sin título)"}</p>
                  <p className="truncate text-xs text-text-muted">
                    {BANNER_PLACEMENT_LABEL[banner.placement] ?? banner.placement} · posición {banner.position}
                  </p>
                  <div className="mt-1">
                    {banner.is_active ? (
                      <StatusBadge label="Activo" tone="success" icon="checkCircle" />
                    ) : (
                      <StatusBadge label="Inactivo" tone="muted" icon="close" />
                    )}
                  </div>
                </div>
              </Link>
              <form action={deleteBannerAction} className="shrink-0">
                <input type="hidden" name="bannerId" value={banner.id} />
                <ConfirmSubmitButton
                  confirmMessage={`¿Eliminar el banner "${banner.title ?? "(sin título)"}"? No se puede deshacer.`}
                  title="Eliminar banner"
                  aria-label={`Eliminar ${banner.title ?? "banner"}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-danger hover:bg-danger/10 hover:text-danger"
                >
                  <Icon name="trash" size={16} />
                </ConfirmSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
