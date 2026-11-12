import { Fragment, type ReactNode } from "react";

// A safe reading of Markdown: headings, paragraphs, lists, quotes, rules, code, tables, bold, italics, code and
// links (http, https and mailto only). It builds React elements, never HTML from the text, so whatever the
// document holds cannot run. Enough for knowledge documents, guides and notes; not a full CommonMark.

export type MarkdownBlock =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "code"; text: string }
  | { kind: "rule" }
  | { kind: "table"; head: string[]; rows: string[][] };

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

/** The blocks of a document, in order. */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index]!;
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index]!.startsWith("```")) body.push(lines[index++]!);
      index += 1;
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1]!.length as 1 | 2 | 3 | 4, text: heading[2]!.trim() });
      index += 1;
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ kind: "rule" });
      index += 1;
      continue;
    }
    if (line.trim().startsWith("|") && /^\s*\|?\s*:?-{2,}/.test(lines[index + 1] ?? "")) {
      const head = cells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index]!.trim().startsWith("|")) rows.push(cells(lines[index++]!));
      blocks.push({ kind: "table", head, rows });
      continue;
    }
    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index]!)) body.push(lines[index++]!.replace(/^\s*>\s?/, ""));
      blocks.push({ kind: "quote", text: body.join(" ") });
      continue;
    }
    const bullet = /^\s*([-*+]|\d+[.)])\s+/;
    if (bullet.test(line)) {
      const ordered = /^\s*\d/.test(line);
      const items: string[] = [];
      while (index < lines.length && bullet.test(lines[index]!)) {
        let item = lines[index++]!.replace(bullet, "");
        // Continuation lines (indented, not a new item) belong to the item.
        while (index < lines.length && /^\s{2,}\S/.test(lines[index]!) && !bullet.test(lines[index]!)) item += ` ${lines[index++]!.trim()}`;
        items.push(item.trim());
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }
    const body: string[] = [];
    while (index < lines.length && lines[index]!.trim() && !/^(#{1,4}\s|```|\s*>|\s*([-*+]|\d+[.)])\s+)/.test(lines[index]!) && !lines[index]!.trim().startsWith("|")) {
      body.push(lines[index++]!.trim());
    }
    if (body.length === 0) {
      body.push(line.trim());
      index += 1;
    }
    blocks.push({ kind: "paragraph", text: body.join(" ") });
  }
  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

/** Bold, italics, code and links inside a line of text. */
export function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    if (!part) return null;
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded-[var(--radius-sm)] bg-[var(--head)] px-1 text-[0.9em] [font-family:var(--font-num)]">{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = /^(https?:|mailto:)/i.test(link[2]!) ? link[2]! : undefined;
      return href ? <a key={index} href={href} target="_blank" rel="noreferrer" className="text-[var(--accent)] underline underline-offset-2">{link[1]}</a> : <Fragment key={index}>{link[1]}</Fragment>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

const HEADING_CLASS = { 1: "text-xl", 2: "text-lg", 3: "text-base", 4: "text-sm" } as const;

/** A Markdown document drawn with the kit's tokens. */
export function MarkdownView({ source, className = "" }: { source: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 text-sm leading-relaxed ${className}`}>
      {parseMarkdown(source).map((block, index) => {
        switch (block.kind) {
          case "heading": {
            const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4";
            return <Tag key={index} className={`${HEADING_CLASS[block.level]} font-semibold [font-family:var(--font-display)]`}>{renderInline(block.text)}</Tag>;
          }
          case "paragraph":
            return <p key={index}>{renderInline(block.text)}</p>;
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={index} className={`flex flex-col gap-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}>
                {block.items.map((item, position) => <li key={position}>{renderInline(item)}</li>)}
              </Tag>
            );
          }
          case "quote":
            return <blockquote key={index} className="border-l-2 border-[var(--accent)] pl-3 text-[var(--muted)]">{renderInline(block.text)}</blockquote>;
          case "code":
            return <pre key={index} className="overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--head)] p-3 text-xs [font-family:var(--font-num)]">{block.text}</pre>;
          case "rule":
            return <hr key={index} className="border-[var(--line)]" />;
          case "table":
            return (
              <div key={index} className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr>{block.head.map((cell, position) => <th key={position} className="label border-b border-[var(--line-strong)] px-2 py-1">{renderInline(cell)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-[var(--line)]">{row.map((cell, position) => <td key={position} className="px-2 py-1 align-top">{renderInline(cell)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
