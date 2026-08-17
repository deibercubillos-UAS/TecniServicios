"use client";

import { useState, useTransition } from "react";
import { Icon } from "@tecni/ui";
import { quickAddToCartAction } from "@/app/(commerce)/carrito/actions";
import { useCartDrawer } from "@/components/cart-drawer/cart-drawer-context";

/** Botón "Agregar al carrito" de la ficha de producto. Antes vivía dentro
 * de un `<form action={addToCartAction}>` que redirigía a `/carrito` — el
 * usuario quiere seguir en la página (o volver al catálogo) sin perder su
 * lugar, así que ahora llama la acción directo y abre el carrito drawer
 * como confirmación visual, igual que ya hace el resto del carrito. */
export function AddToCartButton({ productId, quantity = 1 }: { productId: string; quantity?: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { open } = useCartDrawer();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await quickAddToCartAction(productId, quantity);
      if ("error" in result) {
        setError(result.error);
      } else {
        open();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-brand py-3 text-sm font-bold uppercase tracking-wide text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Agregando..." : "Agregar al carrito"}
        {!pending ? <Icon name="arrowRight" size={18} /> : null}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
