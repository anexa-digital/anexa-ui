import type { ReactNode } from "react";

import { t } from "../../i18n";
import { Badge, type Tone } from "./badge";

// A document the system issued (a ticket, a receipt, a label) shown as it will come out of the printer, with the
// state of its printing beside the title. The page is the document's own (a PDF, an HTML of the same origin):
// it does not follow the skin, because paper does not.

export type PrintState = "queued" | "printing" | "printed" | "failed" | "none";

const PRINT_TONE: Record<PrintState, Tone> = { queued: "warn", printing: "info", printed: "ok", failed: "bad", none: "quiet" };
const PRINT_KEY: Record<PrintState, string> = {
  queued: "print.queued",
  printing: "print.printing",
  printed: "print.printed",
  failed: "print.failed",
  none: "print.none",
};

/** The printing of a document in a word: waiting for the printer, printed, failed. */
export function PrintBadge({ state, label }: { state: PrintState; label?: string }) {
  return (
    <Badge tone={PRINT_TONE[state]} dot>
      {label ?? t(PRINT_KEY[state])}
    </Badge>
  );
}

export function DocumentPreview({
  title,
  src,
  print,
  printDetail,
  actions,
  className = "",
}: {
  title: string;
  /** Address of the document, same origin. */
  src: string;
  print?: PrintState;
  /** Why it failed or where it waits, beside the badge. */
  printDetail?: ReactNode;
  /** Buttons for the document: print again, open in a tab. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={title} className={`flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] ${className}`}>
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] px-3 py-2">
        <h3 className="min-w-0 flex-1 truncate font-medium">{title}</h3>
        {print && <PrintBadge state={print} />}
        {printDetail && <span className="text-xs text-[var(--muted)]">{printDetail}</span>}
        {actions}
      </header>
      {/* Paper is white in every skin: the frame keeps its own ground. */}
      <iframe title={title} src={src} className="min-h-0 w-full flex-1 bg-white" />
    </section>
  );
}
