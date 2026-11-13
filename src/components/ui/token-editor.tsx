import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { t } from "../../i18n";
import { fuzzyFilter } from "../../lib/fuzzy";
import { TOKEN_PATTERN, tokenParts } from "../../lib/text-tokens";
import { buttonClass, inputClass } from "../controls";
import { Icon } from "./icons";
import { PopoverPanel, usePopover } from "./popover";

// Free text with references inserted from lists: the stored value keeps each reference as a token (`⟦kind:key⟧`),
// the reader sees its readable name as a tag that holds together and explains itself on hover. One bar of lists
// («Insert: Variables ▾ Actions ▾ …») puts a tag at the caret; text is typed around the tags as usual. A token no
// list knows (a deleted file, a retired step) shows in the warning tone so it is fixed before saving.

export type TokenOption = {
  /** What is stored in the text, e.g. `⟦var:first_name⟧`. */
  token: string;
  /** The readable name shown in the tag and in the list. */
  label: string;
  /** What it does or what it needs: under the name in the list and on hover over the tag. */
  help?: string;
  /** Listed but not insertable (shown with its `help`). */
  disabled?: boolean;
};

export type TokenGroup = { id: string; label: string; options: TokenOption[] };

export type TokenEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  groups: TokenGroup[];
  /** Accessible name of the text box (the caption of its field). */
  label: string;
  id?: string;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** Tokens shown as tags but no longer listed (kept for old texts): label and help to show for them. */
  extra?: TokenOption[];
  pattern?: RegExp;
};

const CHIP = "token-chip mx-px inline-flex items-center rounded-[var(--radius-sm)] border px-1 align-baseline text-[0.92em] leading-[1.35] whitespace-nowrap select-none";
const CHIP_TONE = { known: "border-transparent bg-[var(--accent-soft)] text-[var(--accent)]", unknown: "border-transparent bg-[var(--warn-soft)] text-[var(--warn)]" };

/** The stored text of the editable box: text runs as typed, tags as their token, line breaks as `\n`. */
function serialize(root: HTMLElement): string {
  let out = "";
  const walk = (node: Node, top: boolean) => {
    const children = Array.from(node.childNodes);
    children.forEach((child, index) => {
      if (child.nodeType === Node.TEXT_NODE) {
        out += (child.nodeValue ?? "").replace(/​/g, "");
        return;
      }
      if (!(child instanceof HTMLElement)) return;
      const token = child.dataset.token;
      if (token) {
        out += token;
      } else if (child.tagName === "BR") {
        // The last <br> of the box is the browser's placeholder for an empty last line, not a break.
        if (!(top && index === children.length - 1)) out += "\n";
      } else {
        // Blocks a browser may create on Enter or paste start a new line.
        const block = child.tagName === "DIV" || child.tagName === "P";
        if (block && out && !out.endsWith("\n")) out += "\n";
        walk(child, false);
      }
    });
  };
  walk(root, true);
  return out;
}

export function TokenEditor({ value, onChange, onBlur, groups, label, id, rows = 6, placeholder, disabled, invalid, describedBy, extra = [], pattern = TOKEN_PATTERN }: TokenEditorProps) {
  const box = useRef<HTMLDivElement>(null);
  const emitted = useRef<string | null>(null);
  const range = useRef<Range | null>(null);
  const [empty, setEmpty] = useState(!value);
  const known = useMemo(() => new Map([...extra, ...groups.flatMap((group) => group.options)].map((option) => [option.token, option])), [groups, extra]);
  const labels = useMemo(() => JSON.stringify([...known.entries()].map(([token, option]) => [token, option.label])), [known]);

  const chip = (token: string) => {
    const option = known.get(token);
    const span = document.createElement("span");
    span.contentEditable = "false";
    span.dataset.token = token;
    span.className = `${CHIP} ${option ? CHIP_TONE.known : CHIP_TONE.unknown}`;
    span.textContent = option ? option.label : token;
    span.title = option ? (option.help ?? option.label) : t("tokens.unknown");
    return span;
  };

  // Rebuild the box only when the value comes from outside (load, reset, paste of tokens) or names change: typing
  // never re-renders it, so the caret stays where it is.
  const built = useRef("");
  useLayoutEffect(() => {
    const root = box.current;
    if (!root || (emitted.current === value && built.current === labels)) return;
    root.replaceChildren(...tokenParts(value, pattern).map((part) => ("token" in part ? chip(part.token) : document.createTextNode(part.text))));
    emitted.current = value;
    built.current = labels;
    setEmpty(!value);
  }, [value, labels]);

  useEffect(() => {
    const keep = () => {
      const selection = document.getSelection();
      if (selection && selection.rangeCount && box.current?.contains(selection.anchorNode)) range.current = selection.getRangeAt(0).cloneRange();
    };
    document.addEventListener("selectionchange", keep);
    return () => document.removeEventListener("selectionchange", keep);
  }, []);

  const emit = () => {
    const root = box.current;
    if (!root) return;
    const next = serialize(root);
    emitted.current = next;
    setEmpty(!next);
    onChange(next);
  };

  const place = (node: Node) => {
    const selection = document.getSelection();
    const after = document.createRange();
    after.setStartAfter(node);
    after.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(after);
    range.current = after.cloneRange();
  };

  const insert = (token: string) => {
    const root = box.current;
    if (!root || disabled) return;
    root.focus();
    let at = range.current;
    if (!at || !root.contains(at.startContainer)) {
      at = document.createRange();
      at.selectNodeContents(root);
      at.collapse(false);
    }
    at.deleteContents();
    const before = at.startContainer.nodeType === Node.TEXT_NODE ? (at.startContainer.nodeValue ?? "").slice(0, at.startOffset) : "";
    const tag = chip(token);
    const space = document.createTextNode(" ");
    at.insertNode(space);
    at.insertNode(tag);
    if (before && !/\s$/.test(before)) tag.before(document.createTextNode(" "));
    place(space);
    emit();
  };

  const paste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    // Tokens pasted as text become tags: rebuild from the stored value and leave the caret at the end.
    if (new RegExp(pattern.source).test(text)) {
      emitted.current = null;
      emit();
      requestAnimationFrame(() => {
        const root = box.current;
        if (root?.lastChild) place(root.lastChild);
      });
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {groups.length > 0 && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label={t("tokens.insert")}>
          <span className="text-xs text-[var(--muted)]">{t("tokens.insert")}</span>
          {groups.map((group) => (
            <TokenMenu key={group.id} group={group} onPick={insert} />
          ))}
        </div>
      )}
      <div
        ref={box}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-disabled={disabled || undefined}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-empty={empty || undefined}
        data-placeholder={placeholder}
        spellCheck
        onInput={emit}
        onBlur={onBlur}
        onPaste={paste}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            document.execCommand("insertLineBreak");
          }
        }}
        style={{ minHeight: `calc(${rows} * 1.5em + 0.75rem)` }}
        className={`w-full overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-sm)] border bg-[var(--field)] px-2 py-1.5 leading-[1.5] outline-none focus:border-[var(--accent)] data-[empty]:before:pointer-events-none data-[empty]:before:text-[var(--muted)] data-[empty]:before:content-[attr(data-placeholder)] ${invalid ? "border-[var(--bad)]" : "border-[var(--line-strong)]"} ${disabled ? "opacity-60" : ""}`}
      />
    </div>
  );
}

/** One list of the insert bar: a button that opens a searchable list; Enter or a click inserts the option. */
function TokenMenu({ group, onPick }: { group: TokenGroup; onPick: (token: string) => void }) {
  const { open, setOpen, box } = usePopover();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const shown = useMemo(() => fuzzyFilter(group.options, query, (option) => `${option.label} ${option.help ?? ""}`), [group.options, query]);
  const pick = (option: TokenOption | undefined) => {
    if (!option || option.disabled) return;
    onPick(option.token);
    setOpen(false);
    setQuery("");
  };
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        className={`${buttonClass} inline-flex items-center gap-1 text-sm`}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={group.options.length === 0}
        // Keep the caret of the text box: the click must not take the focus before the list opens.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          setActive(0);
          setOpen(!open);
        }}
      >
        {group.label}
        <Icon name="chevronDown" className="h-3.5 w-3.5" />
      </button>
      {open && (
        <PopoverPanel label={group.label} className="w-80 max-w-[calc(100vw-2rem)]">
          <input
            autoFocus
            type="search"
            value={query}
            placeholder={t("ui.search")}
            aria-label={t("ui.search")}
            className={`${inputClass} w-full`}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((index) => Math.min(index + 1, shown.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                pick(shown[active]);
              }
            }}
          />
          <ul role="listbox" aria-label={group.label} className="max-h-72 overflow-auto">
            {shown.length === 0 && <li className="px-2 py-1.5 text-sm text-[var(--muted)]">{t("ui.noResults", { text: query })}</li>}
            {shown.map((option, index) => (
              <li
                key={option.token}
                role="option"
                aria-selected={index === active}
                aria-disabled={option.disabled || undefined}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(option)}
                className={`flex cursor-pointer flex-col rounded-[var(--radius-sm)] px-2 py-1 ${index === active ? "bg-[var(--head)]" : ""} ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span className="text-sm">{option.label}</span>
                {option.help && <span className="text-xs text-[var(--muted)]">{option.help}</span>}
              </li>
            ))}
          </ul>
        </PopoverPanel>
      )}
    </div>
  );
}
