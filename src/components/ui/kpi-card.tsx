import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Icon, type IconName } from "./icons";

/** How a card asks for attention: a count to act on, a risk, or plain information. */
export type KpiTone = "neutral" | "attention" | "risk";

// The icon's tile in the color of the tone: the palette's second voice when there is nothing to do.
const TILE: Record<KpiTone, string> = {
  neutral: "bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)] text-[var(--accent-2)]",
  attention: "bg-[var(--accent-soft)] text-[var(--accent)]",
  risk: "bg-[var(--bad-soft)] text-[var(--bad)]",
};

/** The icon of a card or panel of Inicio, on a tile in the tone's color. */
export function KpiIcon({ name, tone = "neutral" }: { name: IconName; tone?: KpiTone }) {
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] ${TILE[tone]}`}>
      <Icon name={name} />
    </span>
  );
}

/**
 * One indicator of Inicio: an icon, a label, a big number and a line of detail; the whole card leads to the screen where
 * the work is. The tone colors the edge and the icon (and the number, for a risk) while there is something to see.
 */
export function KpiCard({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
  to,
  params,
  search,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon: IconName;
  tone?: KpiTone;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
}) {
  return (
    <Link
      to={to as never}
      params={params as never}
      search={search as never}
      className="group relative flex min-h-[5.5rem] items-start gap-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 hover:border-[var(--line-strong)] hover:bg-[var(--row-hover)]"
    >
      {tone !== "neutral" && <i aria-hidden className={`led absolute top-2.5 right-2.5 ${tone === "risk" ? "text-[var(--bad)]" : "text-[var(--accent)]"}`} />}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="label">{label}</span>
        <span className={`num text-2xl font-semibold leading-tight [font-family:var(--font-display)] ${tone === "risk" ? "text-[var(--bad)]" : ""}`}>{value}</span>
        {detail ? <span className="text-xs text-[var(--muted)]">{detail}</span> : null}
      </div>
      <KpiIcon name={icon} tone={tone} />
    </Link>
  );
}
