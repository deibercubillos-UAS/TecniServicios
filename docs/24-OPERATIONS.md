# 24 — Operación

Volver a [`00-INDEX.md`](./00-INDEX.md)

Paso 1.3 de `ACTIVE-fase-6-endurecimiento-A.md`. Dirigido a quien opera el
sitio día a día en Tecni **sin acceso a este chat** — qué mirar, qué hacer
ante una alerta, cómo restaurar un respaldo, a quién contactar.

---

## 1. Proveedores y accesos

| Proveedor | Para qué | Dónde entrar |
|---|---|---|
| **Vercel** | Hosting, despliegues, variables de entorno | vercel.com — proyecto `tecni` |
| **Supabase** | Base de datos, autenticación, Realtime | supabase.com — proyecto `tecni` (`sieiprqcvubkmrmvwwik`, región `sa-east-1`) |
| **Cloudflare** | DNS, WAF, rate limiting, bot protection | dash.cloudflare.com — dominio de producción |
| **Resend** | Correo transaccional | resend.com |
| **GitHub** | Código, CI, ramas protegidas | github.com/deibercubillos-UAS/TecniServicios |

**Ningún secreto vive en este documento.** Ver `19-DEPLOYMENT.md` sección 1
— todos los tokens/API keys están en Vercel → Environment Variables.

## 2. Qué monitorear

| Señal | Dónde verla | Umbral de atención |
|---|---|---|
| Errores 5xx en producción | Vercel → proyecto → Logs, o el proveedor de monitoreo de errores cuando esté activo (`ACTIVE-fase-6-endurecimiento-A.md` paso 6.1) | Cualquier pico sostenido, no un error aislado |
| Uso de base de datos (CPU, conexiones, tamaño) | Supabase → proyecto → Reports | Advertencia si se acerca al límite del plan |
| Advisors de seguridad de Supabase | Supabase → proyecto → Advisors, o `mcp__Supabase__get_advisors` en sesión de Claude Code | Cualquier hallazgo nuevo tras un cambio de esquema |
| Estado del webhook de Wompi | Panel de Wompi → Webhooks → historial de entregas | Entregas fallidas repetidas — revisar firma/URL |
| Certificado SSL / DNS | Cloudflare → dominio | Expiración o cambio inesperado de registro |
| Builds de Vercel | Vercel → Deployments | Cualquier build roto en `main` |

Sin cuenta de monitoreo de errores activa todavía (paso 6.1 del plan de
Fase 6 la deja lista, sin contratar) — hasta entonces, los logs de Vercel y
Supabase son la única fuente.

## 3. Responder una alerta

1. **Confirmar que es real** — un error aislado no es una alerta, un patrón
   sostenido sí.
2. **Ubicar el alcance** — ¿afecta a todos los usuarios o a un flujo
   específico (pagos, login, catálogo)? Los logs de Vercel muestran la ruta.
3. **Si es un despliegue reciente:** Vercel → Deployments → el despliegue
   anterior bueno → "Promote to Production". Revierte en segundos sin tocar
   código.
4. **Si es la base de datos:** Supabase → Logs → filtrar por el error.
   **Nunca ejecutar una migración correctiva directo en producción sin
   probarla antes** — usar una rama de Supabase si el proyecto la soporta
   (ver sección 4).
5. **Si es un secreto vencido/rotado mal:** `19-DEPLOYMENT.md` sección 6
   (rotación) — el síntoma típico es 401/403 masivo en un solo proveedor.
6. **Avisar** a quien corresponda según el impacto (pagos caídos es
   prioridad máxima — afecta ingreso real).

## 4. Respaldos y restauración

Supabase respalda automáticamente según el plan contratado del proyecto
(verificar el plan real en Supabase → proyecto → Settings → Billing —
**un respaldo diario automático requiere plan Pro o superior**, el plan
Free no lo incluye).

**Un respaldo que nunca se probó restaurar no es un respaldo, es una
esperanza.** Procedimiento de prueba (paso 6.3 del plan de Fase 6):

1. Crear una **rama (branch)** de Supabase desde el punto de respaldo a
   probar — **nunca restaurar directo sobre el proyecto de producción**.
2. Verificar en la rama que las tablas críticas tienen los datos esperados
   (conteo de filas, una consulta puntual sobre un registro conocido).
3. Documentar la fecha de la prueba y el resultado en la bitácora de la
   tarea que la ejecutó.
4. Eliminar la rama de prueba al terminar — no se deja corriendo (costo).

Restaurar sobre producción de verdad (un incidente real, no una prueba) es
una decisión que requiere confirmar el punto de restauración exacto con
quien tenga el contexto del incidente — no se ejecuta a la ligera, se
pierde todo cambio posterior al punto elegido.

## 5. Ramas y despliegues

Cada PR despliega un `preview` en Vercel automáticamente; `main` despliega a
`production`. Ver `19-DEPLOYMENT.md` sección 3 y 8 para el detalle completo
de entornos y flujo de despliegue — este documento no lo repite.

## 6. Contactos

**Pendiente de completar con datos reales de Tecni** — nombre y forma de
contacto de quien administra cada proveedor de la sección 1 (hoy son cuentas
del equipo de desarrollo). Anotado en `progress/TODO.md`.
