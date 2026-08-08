# 06 — Roles y permisos

Volver a [`00-INDEX.md`](./00-INDEX.md) · Políticas en [`05-RLS-SECURITY.md`](./05-RLS-SECURITY.md)

---

## 1. Los cinco roles

| Rol | Quién es | Dónde vive |
|---|---|---|
| `anonymous` | Visitante sin sesión | `(public)` |
| `customer` | Usuario de una empresa cliente | `(customer)/mi-cuenta` |
| `seller` | Asesor comercial de Tecni | `(staff)/ventas` |
| `technician` | Técnico de servicio de Tecni | `(staff)/tecnico` |
| `master` | Administración | `(staff)/admin` |

Un usuario tiene **exactamente un** `user_role`.
Dentro de `customer`, el `company_member_role` (`owner`, `buyer`, `accounting`,
`workshop`) define qué puede hacer dentro de su propia empresa.

---

## 2. Matriz de permisos

✅ total · 🔸 limitado a su alcance · ❌ sin acceso

| Recurso | anon | customer | seller | technician | master |
|---|---|---|---|---|---|
| Catálogo (sin precio) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Precios** | ❌ | ✅ | ✅ | ✅ | ✅ |
| Comparador | ✅ | ✅ | ✅ | ✅ | ✅ |
| Blog | ✅ | ✅ | ✅ | ✅ | ✅ |
| Carrito y compra directa | ❌ | ✅ | 🔸 a nombre de cliente | ❌ | ✅ |
| Solicitar cotización | ❌ | ✅ | 🔸 | ❌ | ✅ |
| Ver cotizaciones | ❌ | 🔸 su empresa | 🔸 sus clientes | ❌ | ✅ |
| Aceptar cotización | ❌ | 🔸 `owner`/`buyer` | ❌ | ❌ | ✅ |
| Ver pedidos | ❌ | 🔸 su empresa | 🔸 sus clientes | ❌ | ✅ |
| Cargar guía de envío | ❌ | ❌ | ✅ | ❌ | ✅ |
| Facturas | ❌ | 🔸 su empresa | 🔸 sus clientes | ❌ | ✅ |
| Equipos adquiridos | ❌ | 🔸 su empresa | 🔸 sus clientes | 🔸 asignados | ✅ |
| Manuales privados | ❌ | 🔸 de sus equipos | ✅ | ✅ | ✅ |
| Agendar mantenimiento | ❌ | ✅ | 🔸 | ❌ | ✅ |
| Confirmar mantenimiento | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reporte de mantenimiento | ❌ | 🔸 lectura | 🔸 lectura | ✅ escribe | ✅ |
| Tickets de soporte | ❌ | 🔸 abre y responde | 🔸 lectura | ✅ | ✅ |
| Notas internas de ticket | ❌ | ❌ | ✅ | ✅ | ✅ |
| Datos de la empresa | ❌ | 🔸 `owner`/`accounting` | 🔸 lectura | ❌ | ✅ |
| Agenda de visitas | ❌ | ❌ | 🔸 propia | ❌ | ✅ |
| Crear/editar productos | ❌ | ❌ | ❌ | ❌ | ✅ |
| Banners y promociones | ❌ | ❌ | ❌ | ❌ | ✅ |
| Publicar en blog | ❌ | ❌ | 🔸 borrador | ❌ | ✅ |
| Usuarios y permisos | ❌ | 🔸 su empresa | ❌ | ❌ | ✅ |
| Configuración global | ❌ | ❌ | ❌ | ❌ | ✅ |
| Auditoría | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Permisos internos de empresa

| Acción | owner | buyer | accounting | workshop |
|---|---|---|---|---|
| Ver precios y catálogo | ✅ | ✅ | ✅ | ✅ |
| Comprar / solicitar cotización | ✅ | ✅ | ❌ | ❌ |
| Aceptar cotización | ✅ | ✅ | ❌ | ❌ |
| Ver facturas | ✅ | ❌ | ✅ | ❌ |
| Editar datos de la empresa | ✅ | ❌ | ✅ | ❌ |
| Invitar usuarios | ✅ | ❌ | ❌ | ❌ |
| Agendar mantenimiento | ✅ | ✅ | ❌ | ✅ |
| Abrir tickets | ✅ | ✅ | ❌ | ✅ |

**El `owner` es el único que invita usuarios a su empresa.** La invitación llega
por Resend, expira en 72 horas y vincula el nuevo usuario a esa `company_id`.

---

## 4. Registro y verificación

```
Registro → correo + contraseña + datos de empresa (NIT)
   │
   ▼
Verificación de correo (obligatoria)
   │
   ▼  ¿el NIT ya existe en companies?
   ├── Sí → se crea company_member con rol 'buyer', queda PENDIENTE
   │        de aprobación del owner de esa empresa
   └── No → se crea company + company_member con rol 'owner'
   │
   ▼
Usuario activo: ve precios, compra, cotiza
```

**No hay aprobación manual de Tecni.** Basta verificar el correo, según la
decisión de producto. La verificación comercial de la empresa
(`companies.is_verified`) la marca un `seller` o `master` y habilita condiciones
especiales a futuro, pero no bloquea la compra.

⚠️ **Riesgo asumido:** cualquiera con un correo válido ve los precios. Queda
registrado en `progress/DECISIONS.md`. Mitigación disponible si se vuelve
problema: exigir aprobación para NITs nuevos.

---

## 5. Protección de rutas

`apps/web/middleware.ts` evalúa cada petición **antes** de renderizar:

```ts
const ROUTE_RULES = [
  { prefix: "/mi-cuenta",      roles: ["customer", "master"] },
  { prefix: "/ventas",         roles: ["seller", "master"] },
  { prefix: "/tecnico",        roles: ["technician", "master"] },
  { prefix: "/admin",          roles: ["master"] },
  { prefix: "/api/v1/admin",   roles: ["master"] },
];
```

Reglas:
- Sin sesión en ruta protegida → redirección a `/login?next=<ruta>`.
- Sesión con rol insuficiente → `/403`, **nunca** redirección al dashboard de otro
  rol (eso filtra información sobre la estructura del sitio).
- Correo sin verificar → `/verificar`, independientemente de la ruta.
- El middleware **no consulta la base de datos**: lee el rol desde el JWT.
  El rol se sincroniza al claim vía trigger en `profiles`.

---

## 6. Cambio de rol

Solo un `master` cambia el `user_role` de otro usuario, y únicamente a través de
`/api/v1/admin/users/:id/role`, que:

1. Verifica que el actor sea `master`.
2. Impide que un master se quite a sí mismo el rol si es el último master activo.
3. Registra `before` y `after` en `audit_log`.
4. Invalida las sesiones activas del usuario afectado.

El paso 4 no es opcional: sin él, un usuario degradado conserva su rol anterior
en el JWT hasta que expire.

---

## 7. 2FA

Obligatorio para `seller`, `technician` y `master`. TOTP vía Supabase Auth MFA.
Al promover a un usuario a uno de esos roles, el primer inicio de sesión fuerza la
configuración de 2FA antes de dar acceso a cualquier ruta de `(staff)`.

Opcional para `customer`, ofrecido en la configuración de cuenta.

---

## 8. Pendientes

- `PENDIENTE-DECISIÓN`: ¿un `seller` puede comprar en nombre de un cliente, o solo
  cotizar? La matriz asume que sí puede, marcado como 🔸.
- Definir si `technician` necesita ver precios (hoy sí, para cotizar repuestos en
  sitio). Revisar cuando exista el flujo de repuestos en mantenimiento.
