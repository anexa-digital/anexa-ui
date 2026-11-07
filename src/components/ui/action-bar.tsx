import type { ReactNode } from "react";

import { t } from "../../i18n";
import type { MenuItem } from "./menu";

// Where the buttons of a screen go and in which order, the same everywhere: the dangerous one apart at the left,
// the secondary ones, and the primary last at the right. Keys are drawn by the buttons (KeyHint) when asked.

/** The row of buttons under a form or at the right of a header: `danger` sits at the left, the rest at the right. */
export function ActionBar({ children, danger, className = "" }: { children?: ReactNode; danger?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {danger && <div className="flex items-center gap-2">{danger}</div>}
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * The «⋯» menu of a row with the standard verbs and keys: open (⏎ already opens), edit (F2), duplicate (D), delete
 * (Supr); anything the screen leaves undefined is left out. Extra items go after.
 */
export function rowActionItems({ onOpen, onEdit, onDuplicate, onDelete, extra = [], deleteLabel }: { onOpen?: () => void; onEdit?: () => void; onDuplicate?: () => void; onDelete?: () => void; extra?: MenuItem[]; deleteLabel?: string }): MenuItem[] {
  const items: MenuItem[] = [];
  if (onOpen) items.push({ id: "open", label: t("ui.open"), icon: "external", keys: "enter", run: onOpen });
  if (onEdit) items.push({ id: "edit", label: t("ui.edit"), icon: "edit", keys: "f2", run: onEdit });
  if (onDuplicate) items.push({ id: "duplicate", label: t("ui.duplicate"), icon: "duplicate", keys: "d", run: onDuplicate });
  items.push(...extra);
  if (onDelete) items.push({ id: "delete", label: deleteLabel ?? t("ui.delete"), icon: "trash", keys: "del", danger: true, separator: items.length > 0, run: onDelete });
  return items;
}
