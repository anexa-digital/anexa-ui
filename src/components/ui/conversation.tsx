import { Fragment, useEffect, useRef, type ReactNode } from "react";

import { t } from "../../i18n";
import { civilDate, formatDate, formatTime } from "../../lib/format";
import { usePreferences } from "../../lib/preferences";
import { buttonClass } from "../controls";
import { Badge, type Tone } from "./badge";
import { Icon, type IconName } from "./icons";

// A conversation as people read it in a chat: what came in on the left, what went out on the right, notes of the
// team or the system in the middle, one day after another. Oldest first; the view opens at the latest message and
// follows new ones while the reader is at the bottom. Texts keep their line breaks; nothing is parsed as HTML.

export type ConversationMedia = { kind: "image" | "document" | "audio" | "video" | "file"; url?: string; name?: string };

export type ConversationItem = {
  id: string;
  /** `in`: written by the other party; `out`: sent to them; `note`: an event or a note, not a message. */
  side: "in" | "out" | "note";
  text: string;
  /** ISO instant. */
  at: string;
  author?: string;
  status?: { label: string; tone?: Tone };
  media?: ConversationMedia;
  /** Extra line under the bubble (a template's name, a cost, a link to the record). */
  meta?: ReactNode;
};

export type ConversationViewProps = {
  items: ConversationItem[];
  label: string;
  /** Older messages exist: the button at the top asks for them. */
  onLoadOlder?: () => void;
  loadingOlder?: boolean;
  /** Under the messages (a composer, a notice that the window is closed). */
  footer?: ReactNode;
  emptyText?: string;
  className?: string;
};

const MEDIA_ICON: Record<ConversationMedia["kind"], IconName> = { image: "eye", document: "draft", audio: "messages", video: "eye", file: "folder" };

export function ConversationView({ items, label, onLoadOlder, loadingOlder, footer, emptyText, className = "" }: ConversationViewProps) {
  const { timeZone } = usePreferences();
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const last = items.at(-1)?.id;
  // Open at the latest message, and follow new ones only while the reader has not scrolled up.
  useEffect(() => {
    const box = scroller.current;
    if (box && atBottom.current) box.scrollTop = box.scrollHeight;
  }, [last]);
  let previousDay = "";
  return (
    <div className={`flex min-h-0 flex-col rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] ${className}`}>
      <div
        ref={scroller}
        role="log"
        aria-label={label}
        aria-live="polite"
        tabIndex={0}
        onScroll={(event) => {
          const box = event.currentTarget;
          atBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
        }}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3"
      >
        {onLoadOlder && (
          <button type="button" onClick={onLoadOlder} disabled={loadingOlder} className={`${buttonClass} self-center text-xs`}>
            {loadingOlder ? t("common.loading") : t("conversation.older")}
          </button>
        )}
        {items.length === 0 && <p className="m-auto text-sm text-[var(--muted)]">{emptyText ?? t("conversation.empty")}</p>}
        {items.map((item) => {
          const day = civilDate(new Date(item.at), timeZone);
          const separator = day !== previousDay;
          previousDay = day;
          return (
            <Fragment key={item.id}>
              {separator && (
                <div role="separator" className="my-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="h-px flex-1 bg-[var(--line)]" />
                  <span>{formatDate(day)}</span>
                  <span className="h-px flex-1 bg-[var(--line)]" />
                </div>
              )}
              <Message item={item} />
            </Fragment>
          );
        })}
      </div>
      {footer && <div className="border-t border-[var(--line)] p-2">{footer}</div>}
    </div>
  );
}

function Message({ item }: { item: ConversationItem }) {
  if (item.side === "note") {
    return (
      <div className="mx-auto max-w-[85%] rounded-[var(--radius-sm)] border border-dashed border-[var(--line-strong)] px-3 py-1.5 text-center text-xs text-[var(--muted)]">
        <span className="whitespace-pre-wrap break-words">{item.text}</span>
        <span className="num ml-2">{formatTime(item.at)}</span>
        {item.meta && <div className="mt-1">{item.meta}</div>}
      </div>
    );
  }
  const out = item.side === "out";
  return (
    <div className={`flex max-w-[85%] flex-col gap-1 ${out ? "self-end items-end" : "self-start items-start"}`}>
      {item.author && <span className="px-1 text-xs text-[var(--muted)]">{item.author}</span>}
      <div className={`rounded-[var(--radius-md)] px-3 py-2 text-sm ${out ? "rounded-br-[var(--radius-sm)] bg-[var(--accent-soft)]" : "rounded-bl-[var(--radius-sm)] border border-[var(--line)] bg-[var(--raised)]"}`}>
        {item.media && <Media media={item.media} />}
        {item.text && <p className="whitespace-pre-wrap break-words">{item.text}</p>}
      </div>
      <div className="flex items-center gap-2 px-1 text-xs text-[var(--muted)]">
        <span className="num">{formatTime(item.at)}</span>
        {item.status && <Badge tone={item.status.tone ?? "quiet"}>{item.status.label}</Badge>}
      </div>
      {item.meta && <div className="px-1 text-xs text-[var(--muted)]">{item.meta}</div>}
    </div>
  );
}

function Media({ media }: { media: ConversationMedia }) {
  const name = media.name ?? t(`conversation.media.${media.kind}`);
  if (media.kind === "image" && media.url) {
    return (
      <a href={media.url} target="_blank" rel="noreferrer" className="mb-1 block">
        <img src={media.url} alt={name} loading="lazy" className="max-h-48 rounded-[var(--radius-sm)]" />
      </a>
    );
  }
  const body = (
    <span className="mb-1 inline-flex items-center gap-1.5 text-xs">
      <Icon name={MEDIA_ICON[media.kind]} className="h-4 w-4" />
      {name}
    </span>
  );
  return media.url ? (
    <a href={media.url} target="_blank" rel="noreferrer" className="block underline-offset-2 hover:underline">
      {body}
    </a>
  ) : (
    <div>{body}</div>
  );
}
