"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@tecni/ui";

import { checkoutDirectItemsAction, removeCartItemAction, requestQuoteFromCartAction, updateCartItemQuantityAction } from "@/app/(commerce)/carrito/actions";
import { getCartDrawerSummaryAction } from "@/app/(commerce)/carrito/drawer-actions";
import type { CartSummary, CartSummaryItem } from "@/app/(commerce)/carrito/get-cart-summary";
import { useCartDrawer } from "./cart-drawer-context";

const EMPTY: CartSummary = { directItems: [], quoteItems: [], thresholdCop: 5_000_000, directSubtotalCop: 0 };

// `@tecni/shared` valida env de servidor al importarse (falla rápido si
// falta una var) — importarlo desde un componente cliente arrastraría esa
// validación al bundle del navegador. `roi-calculator.tsx` tiene el mismo
// problema y la misma solución: un `formatCop` local, sin depender del
// paquete compartido.
const COP_FORMATTER = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
function formatCop(amount: number): string {
  return COP_FORMATTER.format(amount);
}

/** Quinta excepción real del proyecto a "Server Components por defecto"
 * (ver `catalog-nav-dropdown.tsx` para las otras cuatro y por qué): un
 * panel flotente con estado abierto/cerrado, mutaciones sin navegar y
 * cierre con clic afuera/`Escape` necesita cliente. Los datos se cargan
 * bajo demanda al abrir (server action `getCartDrawerSummaryAction`), no
 * se prefetchean — el badge del navbar (conteo real) ya viene del server
 * en `SiteHeader` sin esperar a que se abra el drawer. */
export function CartDrawer() {
  const { isOpen, close, setItemCount } = useCartDrawer();
  const [summary, setSummary] = useState<CartSummary>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const refetch = () => {
    setLoading(true);
    startTransition(async () => {
      const data = await getCartDrawerSummaryAction();
      setSummary(data);
      setItemCount(countUnits(data));
      setLoading(false);
    });
  };

  useEffect(() => {
    if (isOpen) refetch();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  function updateQuantity(cartItemId: string, quantity: number) {
    if (quantity < 1) return;
    const formData = new FormData();
    formData.set("cartItemId", cartItemId);
    formData.set("quantity", String(quantity));
    startTransition(async () => {
      await updateCartItemQuantityAction(formData);
      refetch();
    });
  }

  function removeItem(cartItemId: string) {
    const formData = new FormData();
    formData.set("cartItemId", cartItemId);
    startTransition(async () => {
      await removeCartItemAction(formData);
      refetch();
    });
  }

  const { directItems, quoteItems, thresholdCop, directSubtotalCop } = summary;
  const isEmpty = !loading && directItems.length === 0 && quoteItems.length === 0;

  return (
    <>
      <div aria-hidden="true" onClick={close} className="fixed inset-0 z-40 bg-bg-inverse/50 transition-opacity" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-border bg-bg shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 id="cart-drawer-title" className="text-lg font-bold text-text">
              Tu carrito
            </h2>
            {!loading ? (
              <span className="rounded-full bg-bg-alt px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                {directItems.length + quoteItems.length} producto{directItems.length + quoteItems.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar carrito"
            className="rounded-full p-1 text-text-muted transition-colors hover:bg-bg-alt hover:text-text"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-4 p-6">
              {[0, 1].map((i) => (
                <div key={i} className="flex animate-pulse gap-4">
                  <div className="h-20 w-20 shrink-0 rounded-[var(--radius)] bg-bg-alt" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 rounded bg-bg-alt" />
                    <div className="h-3 w-1/2 rounded bg-bg-alt" />
                    <div className="h-6 w-24 rounded bg-bg-alt" />
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
                <Icon name="cart" size={26} />
              </span>
              <p className="text-text-muted">
                Tu carrito está vacío.{" "}
                <Link href="/catalogo" onClick={close} className="font-medium text-brand hover:underline">
                  Ver catálogo
                </Link>
              </p>
            </div>
          ) : (
            <>
              {directItems.length > 0 ? (
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Icon name="cart" size={20} className="text-brand" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text">Para comprar ahora</h3>
                  </div>
                  <ul>
                    {directItems.map((item, index) => (
                      <CartDrawerRow
                        key={item.id}
                        item={item}
                        priceLabel={formatCop(item.unitPriceCop)}
                        withBorderTop={index > 0}
                        onQuantityChange={(q) => updateQuantity(item.id, q)}
                        onRemove={() => removeItem(item.id)}
                        removeIcon="trash"
                      />
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-sm text-text-muted">Subtotal compra directa</span>
                    <span className="text-lg font-extrabold text-text">{formatCop(directSubtotalCop)}</span>
                  </div>
                </div>
              ) : null}

              {quoteItems.length > 0 ? (
                <>
                  {directItems.length > 0 ? (
                    <div className="relative px-6 py-6">
                      <div aria-hidden="true" className="absolute inset-x-6 top-1/2 border-t border-border" />
                      <div className="relative flex justify-center">
                        <span className="bg-bg px-3 text-xs uppercase tracking-wider text-text-muted">
                          Productos que requieren cotización
                        </span>
                      </div>
                    </div>
                  ) : null}
                  <div className="border-t border-border bg-bg-alt p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon name="document" size={20} className="text-text-muted" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text">Para cotizar</h3>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-text-muted">
                      Estos productos se incluirán en una solicitud de cotización aparte debido a su naturaleza técnica.
                    </p>
                    <ul>
                      {quoteItems.map((item, index) => (
                        <CartDrawerRow
                          key={item.id}
                          item={item}
                          priceLabel="Precio sujeto a cotización"
                          priceMuted
                          withBorderTop={index > 0}
                          onQuantityChange={(q) => updateQuantity(item.id, q)}
                          onRemove={() => removeItem(item.id)}
                          removeIcon="close"
                        />
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>

        {!loading && !isEmpty ? (
          <div className="border-t border-border p-6">
            {quoteItems.length > 0 ? (
              <p className="mb-4 text-xs text-text-muted">
                Los productos de {formatCop(thresholdCop)} o más se cotizan asistidos por un vendedor — no se pagan en línea.
              </p>
            ) : null}
            <div className="flex flex-col gap-3">
              {directItems.length > 0 ? (
                <form action={checkoutDirectItemsAction}>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-brand text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-60"
                  >
                    <span>Ir a Pagar</span>
                    <span>({formatCop(directSubtotalCop)})</span>
                  </button>
                </form>
              ) : null}
              {quoteItems.length > 0 ? (
                <form action={requestQuoteFromCartAction}>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius)] border-2 border-text text-sm font-semibold text-text transition-colors hover:bg-bg-alt disabled:opacity-60"
                  >
                    <Icon name="document" size={18} />
                    <span>Solicitar Cotización ({quoteItems.length} ítem{quoteItems.length === 1 ? "" : "s"})</span>
                  </button>
                </form>
              ) : null}
            </div>
            <div className="mt-4 text-center">
              <Link href="/carrito" onClick={close} className="text-sm font-medium text-text-muted underline underline-offset-4 hover:text-brand">
                Ver Carrito Completo
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function countUnits(summary: CartSummary): number {
  return summary.directItems.length + summary.quoteItems.length;
}

function CartDrawerRow({
  item,
  priceLabel,
  priceMuted,
  withBorderTop,
  onQuantityChange,
  onRemove,
  removeIcon,
}: {
  item: CartSummaryItem;
  priceLabel: string;
  priceMuted?: boolean;
  withBorderTop: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  removeIcon: "trash" | "close";
}) {
  return (
    <li className={`flex gap-4 py-4 ${withBorderTop ? "border-t border-border" : ""}`}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius)] border border-border bg-bg-alt">
        {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover" /> : null}
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-tight text-text">
              {item.productSlug ? (
                <Link href={`/catalogo/${item.productSlug}`} className="hover:text-brand">
                  {item.productName}
                </Link>
              ) : (
                item.productName
              )}
            </h4>
            <button type="button" onClick={onRemove} aria-label="Quitar producto" className="text-text-muted transition-colors hover:text-danger">
              <Icon name={removeIcon} size={16} />
            </button>
          </div>
          {item.brandName ? <span className="mt-1 block text-xs text-text-muted">{item.brandName}</span> : null}
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex h-8 items-center rounded-[var(--radius)] border border-border">
            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex h-full w-8 items-center justify-center text-text-muted transition-colors hover:bg-bg-alt hover:text-text disabled:opacity-40"
              aria-label="Disminuir cantidad"
            >
              <Icon name="minus" size={14} />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-text">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity + 1)}
              className="flex h-full w-8 items-center justify-center text-text-muted transition-colors hover:bg-bg-alt hover:text-text"
              aria-label="Aumentar cantidad"
            >
              <Icon name="plus" size={14} />
            </button>
          </div>
          <span className={`whitespace-nowrap text-right text-sm ${priceMuted ? "italic text-text-muted" : "font-semibold text-text"}`}>
            {priceLabel}
          </span>
        </div>
      </div>
    </li>
  );
}
