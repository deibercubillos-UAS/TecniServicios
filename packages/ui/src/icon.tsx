/**
 * Set mínimo de íconos en línea (sin fuente externa — Stitch usaba Google
 * Material Symbols vía CDN, reemplazado acá). Solo los que usa la home
 * migrada de Stitch (docs/17-STITCH-MIGRATION.md paso 6.2). Trazos
 * `currentColor`, hereda el color de texto del contenedor.
 */
const PATHS = {
  search: "M11 4a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4Zm-5 7a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z",
  cart: "M3 3h2l.4 2M7 13h10l3-8H6.4M7 13 5.4 5M7 13l-1.6 4h11.2M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  heart: "M12 21s-7-4.35-9.3-8.55C1.1 9.1 2.3 5.9 5.4 5.1c1.9-.5 3.9.2 5 1.8a5.6 5.6 0 0 1 5-1.8c3.1.8 4.3 4 2.7 7.35C19 16.65 12 21 12 21Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5Z",
  arrowRight: "M5 12h13M13 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  headset: "M12 3a8 8 0 0 0-8 8v5a2 2 0 0 0 2 2h1v-6H5v-1a7 7 0 0 1 14 0v1h-2v6h1a2 2 0 0 0 2-2v-5a8 8 0 0 0-8-8Z",
  shield: "M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Zm0 2.2 6 2.25v4.55c0 3.9-2.5 6.85-6 8.85-3.5-2-6-4.95-6-8.85V6.45L12 4.2Z",
  truck: "M3 6h9v8H3V6Zm9 3h4l3 3v2h-1.5a2 2 0 1 1-4 0H10v-1M6.5 20a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 5.3 20l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-1.9-.5-.5-1.9 2.6-2.6Z",
  bank: "M3 10 12 4l9 6H3Zm1 1h16v2H4v-2Zm1 3h2v6H5v-6Zm5 0h2v6h-2v-6Zm5 0h2v6h-2v-6ZM3 20h18v2H3v-2Z",
  handshake: "M8 12 4 8l3-3 4 4 2-2 5 5-2 2-1-1-3 3-1-1-3 3-1-1Z",
  history: "M12 8v5l3 2M4 12a8 8 0 1 1 2.3 5.6M4 12H2m2 0 2-2m-2 2 2 2",
  building: "M4 21V5a1 1 0 0 1 1-1h6v17M13 21V9h6a1 1 0 0 1 1 1v11M7 7h1m2 0h1m-4 4h1m2 0h1m-4 4h1m2 0h1m4-4h1m-1 4h1",
  box: "M21 8 12 3 3 8l9 5 9-5Zm0 0v8l-9 5m9-13-9 5m0 0v8m0-8L3 8m0 0v8l9 5",
  medal: "M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-3.5 2.5L6 22l6-3 6 3-2.5-4.5",
  bolt: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.7l2-1.6-2-3.4-2.4 1a8 8 0 0 0-3-1.7L14 2h-4l-.4 2.6a8 8 0 0 0-3 1.7l-2.4-1-2 3.4 2 1.6A8 8 0 0 0 4 12c0 .6.1 1.1.2 1.7l-2 1.6 2 3.4 2.4-1c.9.8 1.9 1.4 3 1.7L10 22h4l.4-2.6c1.1-.3 2.1-.9 3-1.7l2.4 1 2-3.4-2-1.6c.1-.6.2-1.1.2-1.7Z",
  checkCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-1.5-5.5L6 12l1.4-1.4 3.1 3.1 6.1-6.1L18 9l-7.5 7.5Z",
  car: "M5 17h14M5 17a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0M5 17l1.5-5.5A2 2 0 0 1 8.4 10h7.2a2 2 0 0 1 1.9 1.5L19 17M5 17H3v-2h1m15 2h2v-2h-1",
  drop: "M12 2s6 7 6 11.5A6 6 0 0 1 6 13.5C6 9 12 2 12 2Z",
  compress: "M8 4v5H3M16 20v-5h5M3 3l7 7M21 21l-7-7",
  thermostat: "M13 14.8V4a1 1 0 0 0-2 0v10.8a3 3 0 1 0 2 0ZM9 7h2m-2 3h2m-2 3h2",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronRight: "M9 6l6 6-6 6",
  pause: "M8 5h3v14H8V5Zm5 0h3v14h-3V5Z",
  play: "M7 5v14l12-7L7 5Z",
  document: "M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5",
  calculator: "M5 3h14v18H5V3Zm2 3v3h10V6H7Zm0 5v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v2h2v-2h-2ZM7 14v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v2h2v-2h-2ZM7 18v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v2h2v-2h-2Z",
  star: "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2Z",
  sliders: "M4 6h10m4 0h2M4 12h4m4 0h10M4 18h13m4 0h-2M12 4v4M18 10v4M9 16v4",
  close: "M6 6l12 12M18 6 6 18",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className,
  size = 20,
}: {
  name: IconName;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
