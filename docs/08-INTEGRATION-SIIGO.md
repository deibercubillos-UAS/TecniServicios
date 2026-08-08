# 08 — Integración Siigo

Volver a [`00-INDEX.md`](./00-INDEX.md)

Plan contratado: **Siigo Nube Pro**.
Estado: `PENDIENTE-DECISIÓN` — credenciales de API aún no disponibles.

---

## 1. Reparto de responsabilidades

| Dato | Fuente de verdad | Dirección |
|---|---|---|
| Producto: nombre, fotos, specs, categoría, manuales | **Web** | Web → (nada) |
| Producto: precio | **Siigo** | Siigo → Web |
| Cotización | **Siigo** | Siigo → Web |
| Cliente / tercero | Web crea, Siigo confirma | Web ↔ Siigo |
| Factura | **Siigo** | Siigo → Web |
| Inventario | `PENDIENTE-DECISIÓN` | — |

**La clave de vinculación es el `sku`.** Un producto en la web sin `sku` válido en
Siigo no muestra precio y no se puede comprar. Esto se valida al crear el producto
en el panel maestro, no después.

---

## 2. Sincronización de precios

### Estrategia
Sincronización programada + refresco bajo demanda.

```
Cron cada 6 h (Vercel Cron)
   │
   ▼
GET /v1/products en Siigo (paginado)
   │
   ▼
Por cada SKU que existe en products:
   ├── precio cambió → update + audit_log + price_synced_at = now()
   └── sin cambio    → solo actualiza price_synced_at
   │
   ▼
SKUs de la web que Siigo no reconoce → alerta al master
```

Además, **antes de crear una cotización o iniciar un pago**, se refresca el precio
del SKU específico. Nunca se cobra sobre un precio que no se acaba de confirmar.

### Cuando Siigo no responde

| Antigüedad del precio | Comportamiento |
|---|---|
| < 6 horas | Normal |
| 6–48 horas | Se muestra con la nota "Precio sujeto a confirmación" |
| > 48 horas | Se oculta el precio. Solo "Solicitar cotización" |

El campo `products.price_is_stale` controla esto. Un precio viejo mostrado como
firme es peor que no mostrar precio: genera un compromiso comercial que la empresa
no puede sostener.

### Reglas de implementación
- Timeout de 10 s por petición, 3 reintentos con backoff exponencial.
- El token de Siigo se cachea hasta 5 minutos antes de expirar.
- La sincronización **nunca** corre en el hilo de una petición de usuario.
- Cada corrida deja un registro en `audit_log` con el conteo de cambios.

---

## 3. Cotizaciones

Siigo genera el consecutivo. La web nunca inventa números de cotización.

```
Cliente en la web
   │  producto ≥ $5.000.000 COP → "Solicitar cotización"
   ▼
quotes (status = 'requested', siigo_quote_id = null)
   │  se notifica al seller asignado (Resend)
   ▼
El vendedor arma la cotización EN SIIGO
   │
   ▼
La web sincroniza: obtiene siigo_quote_id, número, ítems, total, PDF
   │  status = 'sent'
   ▼
Aparece en el dashboard del cliente Y en el del vendedor
   │
   ├── Cliente acepta → status = 'accepted' → se crea order
   │                    → se notifica al vendedor
   └── Cliente rechaza → status = 'rejected' (se pide motivo, opcional)
```

**El PDF de la cotización** se descarga de Siigo, se guarda en R2 y se sirve
firmado. No se enlaza directamente a Siigo: el cliente no debe tener credenciales
ni ver la URL del ERP.

### Vencimiento
`quotes.valid_until` viene de Siigo. Un cron diario marca como `expired` las
vencidas y notifica al vendedor 3 días antes.

---

## 4. Terceros (clientes)

Cuando una empresa se registra en la web:

1. Se busca en Siigo por número de documento.
2. Si existe → se guarda `companies.siigo_customer_id`.
3. Si no existe → **no se crea automáticamente.** Queda en una bandeja para que
   el vendedor lo revise y cree el tercero en Siigo con los datos fiscales
   correctos.

Crear terceros automáticamente ensucia la contabilidad con registros incompletos.
Este es un caso donde la fricción manual es correcta.

---

## 5. Facturas

Tras confirmar el pago, la factura se genera en Siigo (manual en v1, automática
en fase posterior). La web sincroniza `siigo_invoice_id` y descarga el PDF a R2
para mostrarlo en el dashboard del cliente.

`PENDIENTE-DECISIÓN`: si la facturación electrónica DIAN se dispara desde la web
o queda como proceso manual del área contable. Ver `20-COMPLIANCE.md`.

---

## 6. Contrato del módulo

`packages/integrations/siigo/` expone únicamente:

```ts
getAuthToken(): Promise<string>
listProducts(page): Promise<SiigoProduct[]>
getProductBySku(sku): Promise<SiigoProduct | null>
findCustomerByDocument(doc): Promise<SiigoCustomer | null>
listQuotes(since): Promise<SiigoQuote[]>
getQuote(id): Promise<SiigoQuote>
getQuotePdf(id): Promise<Buffer>
getInvoice(id): Promise<SiigoInvoice>
```

Reglas:
- Ninguna función lanza el error crudo de Siigo. Devuelve `SiigoError` tipado.
- Toda respuesta se valida con Zod antes de salir del módulo. Un cambio en la API
  de Siigo debe fallar ruidosamente en el borde, no corromper datos silenciosamente.
- Los tipos `SiigoProduct` etc. viven en este paquete y **no se filtran** al resto
  de la aplicación: `core` recibe tipos propios del dominio.

---

## 7. Secretos

```
SIIGO_USERNAME
SIIGO_ACCESS_KEY
SIIGO_PARTNER_ID
SIIGO_BASE_URL
```

Solo en variables de entorno del servidor en Vercel. Nunca `NEXT_PUBLIC_*`.
Rotación cada 6 meses o inmediata ante sospecha.

---

## 8. Pendientes bloqueantes

- [ ] Obtener credenciales de API de Siigo Nube Pro.
- [ ] Confirmar que el plan expone endpoints de cotizaciones (no todos los planes lo hacen).
- [ ] Verificar límites de tasa de la API.
- [ ] Confirmar el formato exacto del SKU en Siigo para definir la validación.
- [ ] Decidir si se sincroniza inventario.

**Hasta resolver el primer punto, la fase de catálogo se desarrolla con un
adaptador simulado** (`SiigoMockClient`) que respeta el mismo contrato. Así el
desarrollo no se bloquea y el cambio a producción es sustituir una implementación.
