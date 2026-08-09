"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@tecni/ui";

/** El botón decía "Ver más" pero navega a una página nueva que reemplaza
 * la lista completa (paginación por cursor, no scroll infinito que
 * agrega) — la etiqueta ya no promete algo que no hace. Also agrega
 * feedback de carga real (antes un Link sin ningún estado pendiente). */
export function LoadMoreLink({ href }: { href: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.push(href))}
      className="flex items-center gap-2 rounded-[var(--radius)] border-2 border-text px-6 py-2 text-sm font-semibold text-text transition-colors hover:bg-text hover:text-text-inverse disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Cargando..." : "Ver siguiente página"}
      {!isPending ? <Icon name="arrowRight" size={16} /> : null}
    </button>
  );
}
