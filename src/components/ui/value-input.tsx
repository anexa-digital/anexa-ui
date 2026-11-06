import { t } from "../../i18n";
import type { Editor } from "../../lib/schema";
import { inputClass, selectClass } from "../controls";

/** One control for a value described by a JSON schema editor (lib/schema.ts): checkbox, select, number,
 * multi-line list or text. */
export function ValueInput({ editor, text, onChange, disabled, id }: { editor: Editor; text: string; onChange: (text: string) => void; disabled?: boolean; id?: string }) {
  switch (editor.kind) {
    case "boolean":
      return <input id={id} type="checkbox" checked={text === "true"} disabled={disabled} onChange={(event) => onChange(String(event.target.checked))} className="h-4 w-4" />;
    case "enum":
      return (
        <select id={id} value={text} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={`${selectClass} w-full`}>
          {editor.nullable && <option value="">{t("ui.empty")}</option>}
          {editor.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case "integer":
    case "number":
      return <input id={id} type="number" step={editor.kind === "number" ? "any" : 1} min={editor.min} max={editor.max} value={text} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={`${inputClass} h-8 w-full`} />;
    case "list":
      return <textarea id={id} rows={3} value={text} disabled={disabled} title={t("ui.listHelp")} onChange={(event) => onChange(event.target.value)} className={`${inputClass} w-full py-1`} />;
    default:
      return <input id={id} type={editor.format === "email" ? "email" : editor.format === "uri" ? "url" : "text"} value={text} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={`${inputClass} h-8 w-full`} />;
  }
}
