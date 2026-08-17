"use client";

import { useEffect, useRef, useState } from "react";

/** Séptima excepción real del proyecto a "Server Components por defecto"
 * (ver `cart-drawer.tsx` para las anteriores y por qué): capturar trazos
 * de dibujo necesita un canvas con eventos de puntero. Sin librería
 * externa — una firma es un trazo simple, ~80 líneas de canvas nativo no
 * justifica una dependencia nueva. Serializa a un `<input type="hidden">`
 * con el mismo `name` que la Server Action espera
 * (`signatureDataUrl`, ver `completeMaintenanceAction`), así el `<form>`
 * nativo la envía sin JS adicional en el submit. */
export function SignaturePad({ name }: { name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111111";

    function getPos(event: PointerEvent): { x: number; y: number } {
      const rect = canvas!.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function onPointerDown(event: PointerEvent) {
      drawingRef.current = true;
      const { x, y } = getPos(event);
      ctx!.beginPath();
      ctx!.moveTo(x, y);
    }
    function onPointerMove(event: PointerEvent) {
      if (!drawingRef.current) return;
      const { x, y } = getPos(event);
      ctx!.lineTo(x, y);
      ctx!.stroke();
      setHasStroke(true);
    }
    function onPointerUp() {
      drawingRef.current = false;
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  // Sincroniza el dataURL en el input hidden justo antes de que el <form>
  // lo lea al enviar — sin esto, el submit solo vería el valor inicial
  // vacío del input.
  function syncBeforeSubmit() {
    const canvas = canvasRef.current;
    if (!canvas || !hiddenInputRef.current) return;
    hiddenInputRef.current.value = hasStroke ? canvas.toDataURL("image/png") : "";
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    if (hiddenInputRef.current) hiddenInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onTouchStart={(e) => e.preventDefault()}
        className="h-40 w-full touch-none rounded-[var(--radius)] border border-border bg-bg"
        onPointerUp={syncBeforeSubmit}
      />
      <input ref={hiddenInputRef} type="hidden" name={name} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{hasStroke ? "Firma capturada" : "Dibuja la firma arriba"}</span>
        <button type="button" onClick={clear} className="text-xs font-medium text-brand hover:underline">
          Borrar firma
        </button>
      </div>
    </div>
  );
}
