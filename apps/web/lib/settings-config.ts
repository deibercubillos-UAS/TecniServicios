import type { IconName } from "@tecni/ui";

export type SettingFieldType = "number" | "text" | "tel" | "email" | "url" | "boolean" | "textarea";

export interface SettingFieldConfig {
  key: string;
  label: string;
  type: SettingFieldType;
  placeholder?: string;
  helper?: string;
}

export interface SettingsSectionConfig {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  fields: SettingFieldConfig[];
}

/** Única fuente de verdad de qué claves de `settings` existen, su
 * etiqueta en español, tipo de input y ayuda — la usan tanto la página
 * (para pintar el formulario) como el server action (para saber cómo
 * parsear cada valor de vuelta a JSON). Si se agrega una clave nueva a
 * `settings` (vía migración), se agrega acá para que aparezca en el
 * panel — nunca se edita como JSON crudo. */
export const SETTINGS_SECTIONS: SettingsSectionConfig[] = [
  {
    id: "hero_home",
    title: "Hero del home",
    description: "Título, descripción y botones del panel de texto del hero de inicio (la foto se edita en Banners → Ubicación: Hero del home).",
    icon: "home",
    fields: [
      { key: "home_hero_badge_label", label: "Badge superior", type: "text", placeholder: "Equipamiento industrial para talleres" },
      {
        key: "home_hero_title_line1",
        label: "Título — línea 1 (blanca)",
        type: "text",
        placeholder: "Soluciones que",
      },
      {
        key: "home_hero_title_line2",
        label: "Título — línea 2 (roja)",
        type: "text",
        placeholder: "construyen confianza",
      },
      {
        key: "home_hero_description",
        label: "Descripción",
        type: "textarea",
        placeholder: "Maquinaria, herramientas, repuestos y consumibles para el sector automotriz...",
      },
      {
        key: "home_hero_button1_enabled",
        label: "Mostrar botón 1",
        type: "boolean",
        helper: "Si lo desactivas, el botón no aparece aunque tenga texto y enlace guardados.",
      },
      { key: "home_hero_button1_label", label: "Texto del botón 1", type: "text", placeholder: "Ver catálogo completo" },
      { key: "home_hero_button1_link", label: "Enlace del botón 1", type: "text", placeholder: "/catalogo" },
      {
        key: "home_hero_button2_enabled",
        label: "Mostrar botón 2",
        type: "boolean",
        helper: "Si lo desactivas, el botón no aparece aunque tenga texto y enlace guardados.",
      },
      { key: "home_hero_button2_label", label: "Texto del botón 2", type: "text", placeholder: "Solicitar asesoría" },
      { key: "home_hero_button2_link", label: "Enlace del botón 2", type: "text", placeholder: "/contacto" },
    ],
  },
  {
    id: "cotizaciones",
    title: "Cotizaciones y compras",
    description: "Define desde qué precio un producto deja de tener compra directa y pasa a solicitud de cotización con un vendedor.",
    icon: "calculator",
    fields: [
      {
        key: "quote_threshold_cop",
        label: "Umbral de cotización (COP)",
        type: "number",
        placeholder: "5000000",
        helper: "Productos con precio igual o mayor a este monto no muestran botón de compra — solo \"Solicitar cotización\".",
      },
    ],
  },
  {
    id: "contacto",
    title: "Datos de contacto",
    description: "Se muestran en la página pública /contacto y en el pie de página.",
    icon: "phone",
    fields: [
      { key: "contact_phone", label: "Teléfono de ventas", type: "tel", placeholder: "+57 300 000 0000" },
      { key: "contact_phone_hours", label: "Horario de atención telefónica", type: "text", placeholder: "Lunes a viernes, 8:00 a.m. – 5:00 p.m." },
      { key: "contact_whatsapp", label: "WhatsApp", type: "tel", placeholder: "+57 300 000 0000" },
      { key: "contact_email", label: "Correo de ventas", type: "email", placeholder: "ventas@tecnisas.co" },
      { key: "contact_response_time", label: "Tiempo de respuesta estimado", type: "text", placeholder: "Menos de 24 horas hábiles" },
    ],
  },
  {
    id: "ubicacion",
    title: "Ubicación",
    description: "Dirección de la oficina/bodega, mostrada en /contacto junto con el enlace a Google Maps.",
    icon: "mapPin",
    fields: [
      { key: "contact_address_line", label: "Dirección", type: "text", placeholder: "Calle 00 # 00-00" },
      { key: "contact_address_city", label: "Ciudad", type: "text", placeholder: "Bogotá" },
      {
        key: "contact_map_link",
        label: "Enlace de Google Maps",
        type: "url",
        placeholder: "https://maps.google.com/...",
        helper: "Vacío = se oculta el enlace \"Cómo llegar\" en /contacto.",
      },
    ],
  },
  {
    id: "horarios",
    title: "Horario de atención",
    description: "Horario general del negocio, mostrado en /contacto.",
    icon: "clock",
    fields: [
      { key: "contact_hours_weekday", label: "Lunes a viernes", type: "text", placeholder: "8:00 a.m. – 5:00 p.m." },
      { key: "contact_hours_saturday", label: "Sábados", type: "text", placeholder: "8:00 a.m. – 12:00 m." },
    ],
  },
];
