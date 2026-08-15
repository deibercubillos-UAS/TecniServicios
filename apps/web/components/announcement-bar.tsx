import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon, type IconName } from "@tecni/ui";

interface AnnouncementRow {
  id: string;
  title: string | null;
  link_url: string | null;
  icon: string | null;
}

/**
 * Franja de anuncio sobre el header — placement `announcement_bar`
 * (`packages/core/src/content/manage-banner.ts`), gestionable desde
 * `/admin/banners`. Sin banners activos/vigentes con ese placement, no
 * renderiza nada — nunca un texto fijo inventado (mismo criterio de
 * honestidad de contenido de todo el sitio). Con 1+ banners reales, se
 * desplazan en marquee continuo (contenido duplicado una vez en el
 * marcado, `.animate-marquee` en globals.css se encarga del loop).
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
    .select("id,title,link_url,icon")
    .eq("placement", "announcement_bar")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("position")
    .limit(10);

  const announcements = ((data as AnnouncementRow[] | null) ?? []).filter((row) => Boolean(row.title));
  if (announcements.length === 0) return null;

  const renderItem = (announcement: AnnouncementRow, key: string) => {
    const item = (
      <span className="flex items-center gap-3 whitespace-nowrap">
        {announcement.icon ? <Icon name={announcement.icon as IconName} size={16} className="shrink-0 text-brand" /> : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
        {announcement.title}
      </span>
    );
    return (
      <div key={key} className="flex items-center gap-12 pr-12">
        {announcement.link_url ? (
          <Link href={announcement.link_url} className="hover:text-text-inverse">
            {item}
          </Link>
        ) : (
          item
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full overflow-hidden border-b border-border-inverse bg-bg-inverse py-2 text-sm">
      <div className="animate-marquee flex w-max items-center text-text-inverse-muted">
        {announcements.map((a) => renderItem(a, `a-${a.id}`))}
        {announcements.map((a) => renderItem(a, `b-${a.id}`))}
      </div>
    </div>
  );
}
