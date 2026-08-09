"use client";

import { useState } from "react";

interface GalleryImage {
  url: string;
  alt: string | null;
}

/** Sin imágenes reales, no renderiza nada (nunca un placeholder que
 * simule una foto que no existe). Con 1 sola, no hay miniaturas. */
export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (images.length === 0) return null;
  const active = images[activeIndex] ?? images[0]!;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface p-6 md:h-[520px]">
        <img
          src={active.url}
          alt={active.alt ?? productName}
          className="h-full w-full object-contain transition-transform duration-500 hover:scale-110"
        />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, index) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              aria-current={index === activeIndex}
              className={`aspect-square overflow-hidden rounded-[var(--radius)] border bg-surface transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                index === activeIndex ? "border-2 border-brand" : "border-border opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
