"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@tecni/ui";
import { AddToCartButton } from "./add-to-cart-button";
import { addToCartAction } from "@/app/(commerce)/carrito/actions";
import { COMPARE_CHANGED_EVENT, getCompareList } from "@/lib/compare-list";

export interface StickyProductCtaProps {
  productId: string;
  productName: string;
  isLoggedIn: boolean;
  priceVisible: boolean;
  priceLabel: string | null;
  priceUnconfirmed: boolean;
  /** id del contenedor de la caja de compra principal — la barra aparece
   * solo cuando ese contenedor sale del viewport por arriba. */
  anchorId: string;
}

/** Barra sticky de CTA en la ficha de producto (benchmark es.hunter.com,
 * docs/03-UI-COMPONENTS.md sección 3). Nunca recalcula el umbral ni el
 * precio: replica exactamente los tres estados que ya resuelve el
 * servidor en la caja de compra principal de la página. */
export function StickyProductCta({
  productId,
  productName,
  isLoggedIn,
  priceVisible,
  priceLabel,
  priceUnconfirmed,
  anchorId,
}: StickyProductCtaProps) {
  const [showSticky, setShowSticky] = useState(false);
  const [compareCount, setCompareCount] = useState(0);

  useEffect(() => {
    const anchor = document.getElementById(anchorId);
    if (!anchor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setShowSticky(!entry.isIntersecting);
      },
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorId]);

  useEffect(() => {
    function sync() {
      setCompareCount(getCompareList().length);
    }
    sync();
    window.addEventListener(COMPARE_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COMPARE_CHANGED_EVENT, sync);
  }, []);

  // `CompareBar` (app/layout.tsx) ya ocupa el mismo fixed-bottom cuando
  // hay 2+ productos en comparación (mismo umbral que compare-bar.tsx) —
  // evita superponerse encima.
  if (!showSticky || compareCount >= 2) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 py-3 shadow-lg md:px-6">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{productName}</p>
          {priceVisible && priceLabel ? (
            <p className="text-sm text-text-muted">
              {priceLabel}
              {priceUnconfirmed ? " · sujeto a confirmación" : ""}
            </p>
          ) : null}
        </div>

        {priceVisible ? (
          <form action={addToCartAction} className="shrink-0">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="quantity" value="1" />
            <AddToCartButton />
          </form>
        ) : isLoggedIn ? (
          <Link
            href="/contacto"
            className="flex shrink-0 items-center gap-2 rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-bg-alt"
          >
            <Icon name="headset" size={18} />
            Solicitar cotización
          </Link>
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-hover"
          >
            Inicia sesión para ver precio
          </Link>
        )}
      </div>
    </div>
  );
}
