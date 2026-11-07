import type { ReactNode } from "react";

import { t } from "../../i18n";
import { buttonClass, selectClass } from "../controls";

export const PAGE_SIZES = [25, 50, 100, 200];

/** «1–50 de 320», previous / next and, when the size can change, how many rows a page shows. */
export function Pager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  hint,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  /** What the keys do on the rows, at the right. */
  hint?: ReactNode;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center gap-3 text-[var(--muted)]">
      <span className="tabular-nums">{t("grid.pageOf", { from, to, total })}</span>
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={buttonClass}>
        {t("grid.previous")}
      </button>
      <button type="button" disabled={page * pageSize >= total} onClick={() => onPage(page + 1)} className={buttonClass}>
        {t("grid.next")}
      </button>
      {onPageSize && (
        <label className="flex items-center gap-2">
          {t("grid.pageSize")}
          <select value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))} className={selectClass}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      )}
      {hint ? <span className="ml-auto hidden items-center gap-1.5 lg:flex">{hint}</span> : null}
    </div>
  );
}
