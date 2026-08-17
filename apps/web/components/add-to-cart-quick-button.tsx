"use client";

import { useState, useTransition } from "react";
import { Icon } from "@tecni/ui";
import { quickAddToCartAction } from "@/app/(commerce)/carrito/actions";
import { useCartDrawer } from "@/components/cart-drawer/cart-drawer-context";

/** Hermano del `<Link>` que envuelve `ProductCard`, nunca hijo — anidarlo
 * dentro del `<Link>` sería un botón dentro de un `<a>` (HTML inválido) y
 * navegaría al hacer click. Mismo patrón ya usado por `CompareToggle`.
 * Solo se monta cuando hay sesión (igual que `FavoriteButton`); nunca se
 * mira el umbral de cotización acá — la ficha de producto tampoco lo mira,
 * el umbral solo separa visualmente compra directa de cotización dentro
 * del carrito. */
export function AddToCartQuickButton({ productId }: { productId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { open } = useCartDrawer();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      const result = await quickAddToCartAction(productId, 1);
      if ("error" in result) {
        setError(result.error);
      } else {
        open();
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-brand text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Icon name="cart" size={16} />
        {pending ? "Agregando..." : "Agregar al carrito"}
      </button>
      {error ? (
        <p role="alert" className="absolute left-0 top-full z-10 mt-1 w-max max-w-[220px] rounded-[var(--radius)] border border-danger bg-surface px-2 py-1 text-xs text-danger shadow-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
