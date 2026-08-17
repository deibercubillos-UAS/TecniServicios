import type { SettingFieldConfig } from "@/lib/settings-config";

function fieldDefaultValue(raw: unknown): string {
  return raw === undefined || raw === null ? "" : String(raw);
}

/** Un campo de `settings` (texto/número/textarea/checkbox), reusado por
 * `/admin/configuracion` y por la sección "Home hero" de
 * `/admin/banners` — mismo `SettingFieldConfig`, mismo truco de
 * checkbox+hidden para que un formulario parcial no pierda el valor al
 * desmarcar (docs/tasks/done/DONE-hero-banner-ubicacion.md). */
export function SettingFieldInput({ field, currentValue }: { field: SettingFieldConfig; currentValue: unknown }) {
  if (field.type === "boolean") {
    const checked = currentValue === true;
    return (
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <input id={field.key} name={field.key} type="checkbox" value="1" defaultChecked={checked} className="h-4 w-4" />
          {field.label}
          <input type="hidden" name={field.key} value="0" />
        </label>
        {field.helper ? <p className="text-xs text-text-muted">{field.helper}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field.key} className="text-sm font-medium text-text-muted">
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={field.key}
          name={field.key}
          rows={3}
          defaultValue={fieldDefaultValue(currentValue)}
          placeholder={field.placeholder}
          className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      ) : (
        <input
          id={field.key}
          name={field.key}
          type={field.type === "number" ? "number" : field.type}
          inputMode={field.type === "number" ? "numeric" : undefined}
          min={field.type === "number" ? 0 : undefined}
          defaultValue={fieldDefaultValue(currentValue)}
          placeholder={field.placeholder}
          className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      )}
      {field.helper ? <p className="text-xs text-text-muted">{field.helper}</p> : null}
    </div>
  );
}
