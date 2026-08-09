"use client";

import { useState, useTransition } from "react";
import { Icon } from "@tecni/ui";
import { toggleFavoriteAction } from "@/app/actions/favorites";

/** Solo se monta cuando hay sesión (los usuarios de las páginas que lo
 * usan deciden eso, ver docs/12-MODULE-CATALOG.md sección 6b) — el
 * estado inicial `initialFavorited` viene de una consulta real a
 * `favorites`, nunca asumido en false por defecto. */
export function FavoriteButton({ productId, initialFavorited }: { productId: string; initialFavorited: boolean }) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(productId);
      if ("error" in result) {
        setFavorited(!next);
      } else {
        setFavorited(result.favorited);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={favorited}
      aria-label={favorited ? "Quitar de favoritos" : "Guardar en favoritos"}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-text shadow-sm backdrop-blur transition-colors hover:text-brand disabled:opacity-60"
    >
      <Icon name="heart" size={18} className={favorited ? "fill-brand text-brand" : "fill-none"} />
    </button>
  );
}
