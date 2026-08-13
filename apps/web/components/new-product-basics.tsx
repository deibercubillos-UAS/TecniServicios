"use client";

import { useState } from "react";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Nombre + Slug con autocompletado: el slug se sugiere a partir del
 * nombre mientras el master no lo edite a mano — en cuanto lo toca, deja
 * de autocompletarse (nunca pisa una edición manual). Solo aplica al
 * crear: al editar, sku/slug quedan bloqueados (clave de sincronización
 * con Siigo / enlaces ya indexados). */
export function NewProductBasics() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-text-muted">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ej: Balanceadora Corghi EM9080"
          className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium text-text-muted">
          Slug (URL del producto)
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value));
            setSlugTouched(true);
          }}
          placeholder="Ej: balanceadora-corghi-em9080"
          className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <p className="text-xs text-text-muted">
          Se sugiere solo. {slug ? `Quedará en /catalogo/${slug}` : "Se completa a partir del nombre."} No se puede
          cambiar después de crear el producto.
        </p>
      </div>
    </>
  );
}
