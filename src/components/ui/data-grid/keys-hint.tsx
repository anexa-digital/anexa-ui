import { t } from "../../../i18n";

/** What the keys do on the rows of a grid («↑ ↓ fila · ⏎ abrir»), for the pager of a wide screen. */
export function KeysHint({ open }: { open: boolean }) {
  return (
    <>
      <kbd className="kbd">↑</kbd>
      <kbd className="kbd">↓</kbd>
      <span>{t("grid.keysRow")}</span>
      {open && (
        <>
          <span aria-hidden>·</span>
          <kbd className="kbd">⏎</kbd>
          <span>{t("grid.keysOpen")}</span>
        </>
      )}
    </>
  );
}
