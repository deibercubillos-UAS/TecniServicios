"use client";

import { useState } from "react";

/** URL de portada del post — sin subida a R2, así que la única forma de
 * saber si el link sirve es probarlo. Muestra una vista previa en vivo
 * y avisa si la imagen no carga. */
export function PostCoverField({ defaultValue }: { defaultValue: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <input
        id="coverUrl"
        name="coverUrl"
        type="url"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setFailed(false);
        }}
        placeholder="https://..."
        className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />
      {url ? (
        failed ? (
          <p className="text-xs text-danger">No se pudo cargar esa imagen — revisa el enlace.</p>
        ) : (
          <img src={url} alt="" onError={() => setFailed(true)} className="h-32 w-full max-w-sm rounded-[var(--radius)] border border-border object-cover" />
        )
      ) : null}
    </div>
  );
}
