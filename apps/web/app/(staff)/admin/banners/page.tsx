import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon, type IconName } from "@tecni/ui";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StatusBadge } from "@/components/status-badge";
import { BANNER_PLACEMENT_GROUPS } from "@/lib/banner-placement";

import { deleteBannerAction } from "./actions";

export const metadata: Metadata = {
  title: "Banners — Panel maestro",
};

interface BannerRow {
  id: string;
  title: string | null;
  image_url: string | null;
  icon: string | null;
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

export default async function AdminBannersPage({ searchParams }: { searchParams: Promise<{ created?: string; deleted?: string; error?: string }> }) {
  const { created, deleted, error } = await searchParams;
  const supabase = await getSupabase();

  const { data: bannersData } = await supabase.from("banners").select("id,title,image_url,icon,placement,position,is_active").order("position");
  const banners = (bannersData as BannerRow[] | null) ?? [];
  const bannersByPlacement = new Map<string, BannerRow[]>();
  for (const banner of banners) {
    const list = bannersByPlacement.get(banner.placement) ?? [];
    list.push(banner);
    bannersByPlacement.set(banner.placement, list);
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Banners</h1>
        <p className="text-sm text-text-muted">Organizados por ubicación — cada sección del sitio gestiona sus propios banners.</p>
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
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      {BANNER_PLACEMENT_GROUPS.map((group) => {
        const groupBanners = bannersByPlacement.get(group.placement) ?? [];

        return (
          <section key={group.placement} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-text">{group.label}</h2>
                <p className="text-sm text-text-muted">{group.description}</p>
                {group.placement === "promotions" ? (
                  <p className="mt-1 text-xs text-text-muted">
                    Esta imagen es solo el fondo — el descuento (producto/categoría, valor, vigencia) se define en{" "}
                    <Link href="/admin/promociones" className="text-brand hover:underline">
                      Promociones
                    </Link>
                    . Sin una promoción activa, esta sección no aparece en el home aunque subas la imagen.
                  </p>
                ) : null}
                {group.placement === "home_hero" ? (
                  <p className="mt-1 text-xs text-text-muted">
                    Las fotos de abajo son el carrusel de la derecha. El badge, título, descripción y botones del panel de
                    texto (uno solo, compartido por todas las fotos) se editan al abrir o crear cualquiera de estos banners.
                  </p>
                ) : null}
              </div>
              <Link
                href={`/admin/banners/nuevo?placement=${group.placement}`}
                className="flex shrink-0 items-center gap-2 rounded-[var(--radius)] bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
              >
                <Icon name="image" size={16} />
                Nuevo
              </Link>
            </div>

            {groupBanners.length === 0 ? (
              <p className="rounded-[var(--radius)] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-sm text-text-muted">
                Todavía no hay banners acá.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {groupBanners.map((banner) => (
                  <li key={banner.id} className="group flex items-center gap-3 rounded-xl border border-border bg-bg p-3 transition-colors hover:border-brand">
                    <Link href={`/admin/banners/${banner.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-alt">
                        {banner.placement === "announcement_bar" ? (
                          <Icon name={(banner.icon as IconName) || "bolt"} size={20} className="text-text-muted" />
                        ) : banner.image_url ? (
                          <img src={banner.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Icon name="image" size={20} className="text-text-muted" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-text group-hover:text-brand">{banner.title ?? "(sin título)"}</p>
                        <p className="truncate text-xs text-text-muted">posición {banner.position}</p>
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
          </section>
        );
      })}
    </div>
  );
}
