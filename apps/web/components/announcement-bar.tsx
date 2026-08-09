import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

interface AnnouncementRow {
  title: string | null;
  link_url: string | null;
}

/**
 * Franja de anuncio sobre el header — placement `announcement_bar`
 * (`packages/core/src/content/manage-banner.ts`), gestionable desde
 * `/admin/banners`. Sin banner activo/vigente con ese placement, no
 * renderiza nada — nunca un texto fijo inventado (mismo criterio de
 * honestidad de contenido de todo el sitio).
 */
export async function AnnouncementBar() {
  const cookieStore = await cookies();
  const supabase = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });

  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("banners")
    .select("title,link_url")
    .eq("placement", "announcement_bar")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("position")
    .limit(1)
    .maybeSingle();

  const announcement = data as AnnouncementRow | null;
  if (!announcement?.title) return null;

  const content = (
    <p className="mx-auto max-w-[1280px] px-4 py-2 text-center text-sm font-medium text-text-inverse md:px-6">{announcement.title}</p>
  );

  return (
    <div className="bg-brand">
      {announcement.link_url ? (
        <Link href={announcement.link_url} className="block hover:underline">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
