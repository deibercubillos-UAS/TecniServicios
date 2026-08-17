"use client";

import { Icon } from "@tecni/ui";
import { useCartDrawer } from "./cart-drawer-context";

/** Antes era un `<Link href="/carrito">` que navegaba a la página completa.
 * Ahora abre el drawer — el mismo badge de conteo real (nunca fabricado,
 * ver comentario en site-header.tsx) se inicializa acá desde el server y
 * se mantiene sincronizado en el contexto tras cada mutación del drawer. */
export function CartTrigger({ count }: { count: number }) {
  const { open, itemCount } = useCartDrawer(count);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Carrito${itemCount > 0 ? ` — ${itemCount} artículo${itemCount === 1 ? "" : "s"}` : ""}`}
      className="relative flex h-11 w-11 touch-manipulation items-center justify-center text-text-inverse-muted transition-colors hover:text-text-inverse"
    >
      <Icon name="cart" size={22} />
      {itemCount > 0 ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-text-inverse">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}
