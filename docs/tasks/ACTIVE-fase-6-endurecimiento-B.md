# TAREA: Fase 6 — Endurecimiento (parte B: bitácora, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-6-endurecimiento-A.md`](./ACTIVE-fase-6-endurecimiento-A.md)

## Bitácora

### 2026-08-09 — paso 1.1 (docs/20-COMPLIANCE.md)

- **Hecho:** escrito `docs/20-COMPLIANCE.md` — qué dato se recolecta y su
  base legal, confirmación de que el consentimiento ya se registra desde
  la Fase 1 (`registerUser` graba los tres campos en el mismo insert),
  los seis derechos del art. 8 de la Ley 1581 uno por uno con cómo
  responde (o no responde todavía) la plataforma, retención fiscal
  explicada (facturación no se borra, la respuesta a supresión es
  anonimizar `profiles` sin tocar `orders`/`payments`/`quotes`), rol de
  Siigo en la facturación electrónica (fuera de este repositorio),
  tabla de estado al cierre. Advertencia explícita en el encabezado: no
  sustituye revisión de abogado.
- **Archivos:** `docs/20-COMPLIANCE.md` (nuevo, 108 líneas),
  `docs/00-INDEX.md` (estado 20 → ✅).
- **Resultado:** verificación OK, bajo el límite de 500 líneas. Cierra
  el paso 1.1. Sigue el 1.2 (checklist de accesibilidad en
  `02-DESIGN-SYSTEM.md`).
- **Commit:** `docs(compliance): agrega 20-COMPLIANCE.md`

## Bloqueos

- **Restauración de respaldo (paso 6.3):** requiere confirmar que el plan de
  Supabase del proyecto real soporta branching/point-in-time restore antes de
  intentarlo — se verifica en el paso 6.2 primero.
- **Textos legales (paso 5.2):** se redactan con buena fe pero no sustituyen
  revisión de un abogado — no se marca "listo para producción" sin esa
  revisión externa al equipo.

## Pendientes descubiertos

Ninguno todavía.
