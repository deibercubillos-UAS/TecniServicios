import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { BANNER_PLACEMENT_LABEL } from "@/lib/banner-placement";

export const metadata: Metadata = {
  title: "Banners — Panel maestro",
};

interface BannerRow {
  id: string;
  title: string | null;
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

export default async function AdminBannersPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  const supabase = await getSupabase();

  const { data: bannersData } = await supabase.from("banners").select("id,title,placement,position,is_active").order("placement").order("position");
  const banners = (bannersData as BannerRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">Banners</h1>
        <Link
          href="/admin/banners/nuevo"
          className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
        >
          Nuevo banner
        </Link>
      </div>

      {created ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Banner creado.</p>
      ) : null}

      {banners.length === 0 ? (
        <p className="text-text-muted">Sin banners.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {banners.map((banner) => (
            <li key={banner.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/admin/banners/${banner.id}`} className="font-medium text-text hover:text-brand">
                  {banner.title ?? "(sin título)"}
                </Link>
                <p className="text-xs text-text-muted">
                  {BANNER_PLACEMENT_LABEL[banner.placement] ?? banner.placement} · posición {banner.position}
                </p>
              </div>
              {!banner.is_active ? (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted">Inactivo</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
