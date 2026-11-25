import type { ReactNode } from "react";

import { t } from "../../i18n";
import { civilDate, formatDate, formatTime } from "../../lib/format";
import { usePreferences } from "../../lib/preferences";
import { Icon, type IconName } from "./icons";
import { EmptyState, LoadError, Skeleton, type Empty } from "./widgets";

// What happened with a record, one entry after another under the day it happened: who did it, what it says and the
// records it names. The screen gives the entries in the order it wants them read (the latest first, usually) and
// the kit groups them by day in the person's time zone. For messages that come and go, use ConversationView.

export type TimelineItem = {
  id: string;
  /** When: an ISO instant, or a civil day `YYYY-MM-DD` for what has a day and no hour (an invoice). */
  at: string;
  title: ReactNode;
  /** Its kind in a word, drawn as a caption before the title («Llamada», «Solicitud»). */
  kind?: string;
  icon?: IconName;
  /** `accent`: something a person did or wrote. `quiet` (default): what the system recorded. The rest: an outcome. */
  tone?: "accent" | "quiet" | "ok" | "warn" | "bad";
  /** Beside the title: a badge, a status. */
  meta?: ReactNode;
  /** Who did it. */
  actor?: string;
  /** What it says: a paragraph, a MarkdownView. */
  body?: ReactNode;
  /** The record it names (a `RecordLink`), or several. */
  link?: ReactNode;
  /** Its own actions at the right (a button, a «⋯» menu). */
  actions?: ReactNode;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

const TONE: Record<NonNullable<TimelineItem["tone"]>, string> = {
  accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  quiet: "bg-[var(--head)] text-[var(--muted)]",
  ok: "bg-[var(--head)] text-[var(--ok)]",
  warn: "bg-[var(--head)] text-[var(--warn)]",
  bad: "bg-[var(--head)] text-[var(--bad)]",
};

/** The entries under their days, in the order given: a new group starts whenever the civil day changes. */
export function timelineDays<T extends { at: string }>(items: T[], timeZone: string): { day: string; items: T[] }[] {
  const days: { day: string; items: T[] }[] = [];
  for (const item of items) {
    const date = new Date(item.at);
    const day = DAY.test(item.at) || Number.isNaN(date.getTime()) ? item.at.slice(0, 10) : civilDate(date, timeZone);
    const last = days.at(-1);
    if (last && last.day === day) last.items.push(item);
    else days.push({ day, items: [item] });
  }
  return days;
}

/**
 * `label` names the list for readers. `loading` draws the skeleton of a first load, `error` the failure with
 * «Reintentar» (`onRetry`), and no entries the `empty` state. `footer` holds «Ver más» or a pager.
 */
export function Timeline({
  items,
  label,
  loading,
  error,
  onRetry,
  empty,
  timeZone,
  footer,
  className = "",
}: {
  items: TimelineItem[];
  label?: string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** What it says with no entries: a title, or a title with a body and an action. */
  empty?: string | Empty;
  /** IANA zone the days and hours are read in; the person's by default. */
  timeZone?: string;
  footer?: ReactNode;
  className?: string;
}) {
  const preferences = usePreferences();
  const zone = timeZone ?? preferences.timeZone;
  if (error) return <LoadError error={error} onRetry={onRetry} />;
  if (loading && items.length === 0) return <Skeleton lines={6} />;
  if (items.length === 0) return <EmptyState {...(typeof empty === "string" ? { title: empty } : (empty ?? { title: t("timeline.empty") }))} />;
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <ol aria-label={label ?? t("timeline.label")} className="flex flex-col gap-3">
        {timelineDays(items, zone).map((group) => (
          <li key={group.day} className="flex flex-col">
            <h3 className="label border-b border-[var(--line)] pb-1">{formatDate(group.day)}</h3>
            <ol className="flex flex-col">
              {group.items.map((item) => (
                <Entry key={item.id} item={item} timeZone={zone} />
              ))}
            </ol>
          </li>
        ))}
      </ol>
      {footer && <div className="flex justify-center">{footer}</div>}
    </div>
  );
}

function Entry({ item, timeZone }: { item: TimelineItem; timeZone: string }) {
  const hour = DAY.test(item.at) || Number.isNaN(new Date(item.at).getTime()) ? null : formatTime(item.at, { timeZone });
  return (
    <li className="flex gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
      <span aria-hidden className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-pill)] ${TONE[item.tone ?? "quiet"]}`}>
        <Icon name={item.icon ?? "calendar"} className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {item.kind && <span className="label">{item.kind}</span>}
          <span className="min-w-0 font-medium">{item.title}</span>
          {item.meta}
        </div>
        {(hour || item.actor) && (
          <span className="text-xs text-[var(--muted)]">
            {hour && <time dateTime={item.at} className="num">{hour}</time>}
            {hour && item.actor ? " · " : ""}
            {item.actor}
          </span>
        )}
        {item.body && <div className="prose-narrow">{item.body}</div>}
        {item.link && <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">{item.link}</div>}
      </div>
      {item.actions && <div className="flex shrink-0 items-start gap-2">{item.actions}</div>}
    </li>
  );
}
