"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface CartDrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  itemCount: number;
  setItemCount: (count: number) => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

/** Único estado global client-side del carrito: abrir/cerrar el drawer y el
 * contador de ítems (para que el badge del navbar y el drawer siempre
 * muestren el mismo número, sin round-trip al servidor tras cada
 * mutación). Mismo espíritu que `compare-list.ts`/`CompareBar`, el único
 * precedente de estado flotante client-side del proyecto — sin librería
 * nueva, un Context simple alcanza. */
export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  const value = useMemo<CartDrawerContextValue>(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      itemCount,
      setItemCount,
    }),
    [isOpen, itemCount],
  );

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
}

/** `initialCount` (el conteo real calculado por el server en `SiteHeader`)
 * se sincroniza al contexto la primera vez que se monta el trigger —
 * después el contexto manda, para no pisar el número tras una mutación
 * optimista con el valor stale que trae el server component en el próximo
 * render. */
export function useCartDrawer(initialCount?: number) {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) {
    throw new Error("useCartDrawer debe usarse dentro de CartDrawerProvider");
  }

  const { setItemCount } = ctx;
  // Solo la primera vez que se conoce el valor real del server — no en
  // cada render, o pisaría las actualizaciones optimistas del drawer.
  useEffect(() => {
    if (typeof initialCount === "number") setItemCount(initialCount);
  }, []);

  return ctx;
}
