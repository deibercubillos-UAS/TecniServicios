# 01 — Arquitectura

Volver a [`00-INDEX.md`](./00-INDEX.md) · Reglas en [`../CLAUDE.md`](../CLAUDE.md)

---

## 1. Principio rector

**Una sola aplicación web, backend desacoplado desde el día uno.**

La decisión de tener una sola app (no `apps/web` + `apps/admin`) simplifica el
desarrollo, pero traslada la responsabilidad de seguridad al **middleware y a las
políticas RLS**, no a la separación física de despliegues. Esto se compensa con:

- Segmentación estricta de rutas por grupo (`(public)`, `(customer)`, `(staff)`).
- Middleware que valida rol antes de renderizar cualquier ruta de `(staff)`.
- RLS en la base de datos como última línea de defensa: aunque una ruta se filtre,
  la consulta no devuelve datos ajenos.

Ver el ADR correspondiente: `adr/ADR-0001-monorepo-single-app.md`.

---

## 2. Estructura del monorepo

```
tecni/
├── CLAUDE.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── docs/                       ← toda la documentación
├── apps/
│   └── web/                    ← única aplicación Next.js 15
│       ├── app/
│       │   ├── (public)/       ← home, catálogo, blog, contacto
│       │   ├── (auth)/         ← login, registro, recuperación
│       │   ├── (customer)/     ← dashboard del cliente
│       │   ├── (staff)/        ← vendedor, técnico, master
│       │   └── api/v1/         ← contrato REST (base del APK)
│       ├── components/         ← solo componentes de esta app
│       ├── middleware.ts       ← control de acceso por ruta
│       └── public/
│           └── brand/          ← logo.png y variantes
└── packages/
    ├── core/                   ← LÓGICA DE NEGOCIO. Sin React.
    ├── db/                     ← esquema, migraciones, tipos generados
    ├── ui/                     ← design system reutilizable
    ├── integrations/           ← Siigo, Wompi, Resend, R2
    ├── config/                 ← tsconfig, eslint, tailwind compartidos
    └── shared/                 ← tipos, constantes, validadores Zod
```

---

## 3. Qué va en cada paquete

### `packages/core` — el corazón
Toda regla de negocio. **Sin dependencias de React ni de Next.js.**
Si mañana se construye el APK, este paquete no cambia.

```
core/
├── catalog/      resolución de precios, visibilidad, comparador
├── commerce/     carrito, umbral de cotización, pedidos, estados
├── service/      mantenimientos, tickets, asignación de técnicos
├── companies/    empresas, usuarios, membresías
├── content/      blog, banners, promociones
└── audit/        registro de auditoría
```

**Regla:** una función de `core` recibe un contexto explícito
(`{ userId, companyId, role }`) y nunca lee la sesión por su cuenta.
Esto la hace testeable y reutilizable desde cualquier cliente.

### `packages/db`
Migraciones SQL, políticas RLS, seeds, y los tipos TypeScript generados por
`supabase gen types`. **Los tipos se regeneran en cada migración**, nunca a mano.

### `packages/ui`
Componentes visuales puros. Sin lógica de negocio, sin llamadas a datos.
Consumen exclusivamente los tokens de `02-DESIGN-SYSTEM.md`.

### `packages/integrations`
Un cliente por servicio externo, cada uno con:
- Timeout explícito
- Reintentos con backoff
- Un modo `fallback` documentado (qué pasa si el servicio está caído)
- Nunca lanza el error crudo hacia arriba: lo envuelve en un error tipado

### `packages/shared`
Tipos compartidos y esquemas Zod. **Todo input externo se valida con Zod
antes de tocar la base de datos.** Sin excepción.

---

## 4. Flujo de una petición

```
Navegador
   │
   ▼
Cloudflare (WAF, rate limit, caché de estáticos)
   │
   ▼
Vercel → middleware.ts  ── ¿rol permitido para esta ruta? ── no → /403
   │ sí
   ▼
Route Handler /api/v1/*  o  Server Component
   │
   ▼
packages/core  ── valida entrada (Zod) ── aplica regla de negocio
   │
   ▼
packages/db (Supabase)  ── RLS filtra por company_id y rol
   │
   ▼
Respuesta (nunca incluye campos que el rol no puede ver)
```

**Tres capas de defensa, no una:** middleware (ruta), core (regla), RLS (dato).
Si alguna falla sola, las otras dos siguen protegiendo.

---

## 5. Separación frontend / backend

El requisito "frontend aparte del backend" se cumple así, sin duplicar despliegues:

| Aspecto | Frontend | Backend |
|---|---|---|
| Ubicación | `apps/web/app/(grupos)` | `apps/web/app/api/v1` + `packages/core` |
| Conoce | Componentes, rutas, estado de UI | Reglas, permisos, integraciones |
| No conoce | Reglas de negocio ni secretos | Nada de React ni de Tailwind |
| Consume | `/api/v1` y Server Components | Supabase, Siigo, Wompi, Resend, R2 |

**El contrato entre ambos es `/api/v1`.** Está documentado en `07-API-CONTRACTS.md`
y es lo que el APK consumirá tal cual. Por eso:

- Ningún endpoint devuelve HTML.
- Ninguna respuesta depende del renderizado de Next.
- Toda respuesta es JSON con forma estable: `{ data, error, meta }`.

---

## 6. Estrategia de datos

**Lectura pública** (catálogo sin precios): Server Components con caché de
Next (`revalidate`), consultas directas de solo lectura sobre vistas públicas.

**Lectura privada** (precios, pedidos, cotizaciones): siempre pasa por `core`,
siempre con contexto de usuario, siempre con RLS activa.

**Escritura:** exclusivamente por `/api/v1` o Server Actions que llaman a `core`.
Nunca un `insert` desde el cliente.

---

## 7. Entornos

| Entorno | Rama | Supabase | Dominio |
|---|---|---|---|
| `local` | cualquiera | Supabase local (Docker) | `localhost:3000` |
| `preview` | PR | Proyecto `tecni-staging` | `*.vercel.app` |
| `production` | `main` | Proyecto `tecni-prod` | `PENDIENTE-DECISIÓN` |

**Producción tiene su propio proyecto Supabase.** Nunca se comparte base de datos
entre preview y producción. Los datos de clientes reales no tocan un entorno de
prueba.

---

## 8. Convenciones de carpetas dentro de `apps/web`

```
app/
├── (public)/
│   ├── page.tsx                 home
│   ├── catalogo/
│   │   ├── page.tsx             listado + filtros
│   │   ├── [categoria]/
│   │   └── producto/[slug]/
│   ├── comparador/
│   ├── blog/
│   └── contacto/
├── (auth)/
│   ├── login/ registro/ verificar/ recuperar/
├── auth/callback/    Route Handler, intercambia el code de Supabase Auth
│                     (PKCE) por sesión — lo usa /recuperar (Fase 1, paso 8.4)
├── (customer)/
│   └── mi-cuenta/
│       ├── page.tsx             dashboard
│       ├── equipos/ cotizaciones/ pedidos/ facturas/
│       ├── manuales/ mantenimientos/ soporte/ empresa/
├── (staff)/
│   ├── ventas/                  rol seller
│   ├── tecnico/                 rol technician
│   └── admin/                   rol master
└── api/v1/
    ├── catalog/ quotes/ orders/ payments/ service/ content/ admin/
    └── webhooks/                wompi, siigo
```

**Regla:** un grupo de rutas nunca importa componentes de otro grupo.
Lo compartido vive en `packages/ui` o en `apps/web/components/shared`.

---

## 9. Decisiones registradas

| ADR | Decisión |
|---|---|
| `ADR-0001` | Monorepo Turborepo con una sola app Next.js |
| `ADR-0002` | Lógica de negocio aislada en `packages/core` para habilitar APK |
| `ADR-0003` | Siigo como fuente de precios, web como fuente de catálogo |
| `ADR-0004` | Umbral configurable de $5.000.000 COP para cotización |

---

## 10. Pendientes

- `PENDIENTE-DECISIÓN`: dominio de producción.
- `PENDIENTE-DECISIÓN`: si el blog necesita CDN de imágenes propio o basta Vercel.
- Definir estrategia de caché de precios cuando Siigo esté disponible.
