# 19 — Despliegue y gestión de secretos

Volver a [`00-INDEX.md`](./00-INDEX.md) · Seguridad en [`05-RLS-SECURITY-A.md`](./05-RLS-SECURITY-A.md)

---

## 1. Principio: Vercel es la bóveda

**Todo secreto vive en Vercel → Project Settings → Environment Variables.**
Ese es el único lugar donde una clave existe en texto plano.

| Dónde | ¿Puede haber secretos? |
|---|---|
| Vercel Environment Variables | ✅ Único lugar autorizado |
| `.env.local` en la máquina del desarrollador | ✅ Solo generado por `vercel env pull`, nunca a mano |
| `.env.example` en el repositorio | ✅ Solo nombres de variables, valores vacíos |
| Cualquier archivo versionado | ❌ Nunca |
| Chat, correo, WhatsApp, captura de pantalla | ❌ Nunca |
| Código fuente, comentarios, mensajes de commit | ❌ Nunca |
| Logs, mensajes de error, respuestas de API | ❌ Nunca |

**Regla para Claude Code:** si necesitas un secreto, **no lo pidas por chat**.
Indica al usuario qué variable falta y que la cargue en Vercel. Luego trabaja con
`vercel env pull`. Nunca escribas un valor real de secreto en ningún archivo.

---

## 2. Flujo de trabajo

### Cargar un secreto nuevo (lo hace el usuario, una vez)

Interfaz web: `vercel.com` → proyecto → **Settings → Environment Variables** →
Add New. Se marca en qué entornos aplica (`Production`, `Preview`, `Development`).

O por CLI:
```bash
vercel env add SIIGO_ACCESS_KEY production
# la CLI pide el valor de forma interactiva: no queda en el historial del shell
```

**Nunca** `vercel env add X production --value=...`: eso deja la clave en
`~/.bash_history`.

### Sincronizar al entorno local (lo hace cualquiera que desarrolle)

```bash
vercel link          # una sola vez, vincula la carpeta al proyecto
vercel env pull .env.local
```

Esto genera `.env.local` con los valores del entorno `Development`.
El archivo está en `.gitignore` y **nunca se commitea**.

Cuando alguien cambia un secreto en Vercel, todos vuelven a hacer `env pull`.
No se comparten valores entre personas por ningún canal.

### Documentar una variable nueva

Al añadir una variable, se agrega su **nombre** (sin valor) a `.env.example` y a
la tabla de la sección 4. Ese archivo es el contrato: si alguien clona el
repositorio, sabe qué necesita sin conocer ningún valor.

---

## 3. Entornos

| Entorno Vercel | Rama | Proyecto Supabase | Uso |
|---|---|---|---|
| `Production` | `main` | `tecni-prod` | Sitio real |
| `Preview` | PR / ramas | `tecni-staging` | Pruebas |
| `Development` | local | `tecni-staging` | Desarrollo |

**Los tres entornos tienen valores distintos.** Nunca se apunta `Development` a la
base de datos de producción: un `truncate` accidental en local borraría datos de
clientes reales.

Wompi y Siigo usan credenciales de **sandbox** en `Preview` y `Development`.
Una compra de prueba jamás debe generar un cobro real.

---

## 4. Inventario de variables

### Públicas (`NEXT_PUBLIC_*`) — llegan al navegador

Estas **no son secretas por diseño**. Nada sensible lleva ese prefijo.

| Variable | Notas |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública. Protegida por RLS |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública por diseño. RLS es lo que protege |
| `NEXT_PUBLIC_SITE_URL` | URL base del entorno |
| `WOMPI_PUBLIC_KEY` | Clave pública de la pasarela |

### Secretas — solo servidor

| Variable | Riesgo si se filtra |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Crítico.** Ignora toda RLS. Acceso total a la base |
| `SIIGO_USERNAME` | Alto. Acceso al ERP |
| `SIIGO_ACCESS_KEY` | **Crítico.** Acceso al ERP y datos contables |
| `SIIGO_PARTNER_ID` | Medio |
| `WOMPI_PRIVATE_KEY` | **Crítico.** Operaciones financieras |
| `WOMPI_EVENTS_SECRET` | **Crítico.** Permite falsificar confirmaciones de pago |
| `WOMPI_INTEGRITY_SECRET` | **Crítico.** Permite alterar montos |
| `RESEND_API_KEY` | Alto. Envío de correo suplantando el dominio |
| `R2_ACCESS_KEY_ID` | Alto |
| `R2_SECRET_ACCESS_KEY` | **Crítico.** Acceso a manuales, facturas, adjuntos |

**Regla de nombres:** si una variable no lleva `NEXT_PUBLIC_`, se asume secreta y
**nunca** se importa desde un archivo con `"use client"`. Un `import` de estos en
un componente cliente debe fallar el build, no llegar a producción.

---

## 5. Validación en el arranque

`packages/shared/env.ts` valida todas las variables con Zod al iniciar la app.
Si falta una, la aplicación **no arranca**, con un mensaje que dice cuál falta.

```ts
// El esquema separa explícitamente lo público de lo secreto
export const serverEnv = serverSchema.parse(process.env);
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // ...enumeradas una por una, nunca process.env completo
});
```

**Nunca se pasa `process.env` entero a un esquema de cliente.** Eso filtraría todo
el entorno al bundle del navegador.

Fallar al arrancar es preferible a arrancar con una variable indefinida: un
`undefined` en una clave de API produce errores silenciosos en producción.

---

## 6. Rotación

| Situación | Acción |
|---|---|
| Rutina | Rotar cada 6 meses |
| Sale alguien del equipo | Rotar todo lo que conocía, en el día |
| Sospecha de filtración | Rotar de inmediato, luego investigar |
| Secreto commiteado por error | Rotar **antes** de limpiar el historial |

**Un secreto que llegó a un commit se considera comprometido**, aunque el commit
se borre. El historial de git puede estar clonado, en un fork, o en la caché de
GitHub. Reescribir el historial no lo recupera: solo la rotación lo resuelve.

Después de rotar: actualizar en Vercel, redesplegar y avisar a quien tenga
`.env.local` para que haga `env pull` de nuevo.

---

## 7. Prevención

En `.gitignore` (ya configurado):
```
.env
.env.*
!.env.example
```

Verificación obligatoria antes de cada push (ver `CLAUDE.md` sección 10):
```bash
git status --porcelain | grep -iE "\.env$|\.env\.[^e]|key|secret|credential" \
  && echo "DETENER: posible secreto en el commit"
```

Recomendado: instalar `gitleaks` como hook de pre-commit una vez exista el
monorepo. Es la única defensa que no depende de que alguien recuerde revisar.

---

## 8. Despliegue

| Rama | Resultado |
|---|---|
| `main` | Despliegue automático a producción |
| Cualquier otra | Despliegue de preview con URL propia |

El CI (`.github/workflows/ci.yml`) corre lint, typecheck y build. Si falla, no se
publica — ver `CLAUDE.md` sección 10.

### Migraciones de base de datos

**No corren automáticamente en el despliegue.** Se aplican a mano, en este orden:

1. Probar en local contra Supabase local.
2. Aplicar en `tecni-staging` y verificar.
3. Respaldo de producción y verificación de que el respaldo se puede restaurar.
4. Aplicar en `tecni-prod`.
5. Regenerar los tipos y commitearlos.

Una migración automática que falle a mitad puede dejar la base en un estado
inconsistente sin nadie mirando. El paso manual es intencional.

---

## 9. Cloudflare

DNS con proxy activo, WAF, Bot Fight Mode y rate limiting según
`05-RLS-SECURITY-B.md` sección 7. Los tokens de API de Cloudflare siguen la misma
regla: viven en Vercel, nunca en el repositorio.

---

## 10. Pendientes

- `PENDIENTE-DECISIÓN`: dominio de producción.
- [ ] Crear los tres entornos en Vercel al terminar la Fase 0.
- [ ] Configurar `gitleaks` como hook de pre-commit.
- [ ] Documentar y **probar** la restauración de respaldos (Fase 6). Un respaldo
      que nunca se restauró no es un respaldo.
