import { t } from "../../../i18n";

/** What the keys do on the rows of a grid («↑ ↓ fila · ⏎ abrir · Espacio seleccionar · F2 editar»), for the pager. */
export function KeysHint({ open, select, edit, create }: { open: boolean; select?: boolean; edit?: boolean; create?: boolean }) {
  const part = (keys: string[], text: string) => (
    <>
      <span aria-hidden>·</span>
      {keys.map((key) => (
        <kbd key={key} className="kbd">
          {key}
        </kbd>
      ))}
      <span>{text}</span>
    </>
  );
  return (
    <>
      <kbd className="kbd">↑</kbd>
      <kbd className="kbd">↓</kbd>
      <span>{t("grid.keysRow")}</span>
      {open && part(["⏎"], t("grid.keysOpen"))}
      {select && part(["Espacio"], t("grid.keysSelect"))}
      {edit && part(["F2"], t("grid.keysEdit"))}
      {create && part(["N"], t("grid.keysNew"))}
    </>
  );
}
