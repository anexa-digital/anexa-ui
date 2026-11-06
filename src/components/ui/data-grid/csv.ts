import { postForFile } from "../../../lib/api";

// CSV as spreadsheets in Spanish-speaking locales open it: semicolon separator and a BOM so accents survive.
const SEPARATOR = ";";

function field(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(head: string[], rows: (string | number | null | undefined)[][]): string {
  return `﻿${[head, ...rows].map((row) => row.map(field).join(SEPARATOR)).join("\r\n")}\r\n`;
}

/** Hands the browser a file to save. */
export function download(name: string, content: string | Blob, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(typeof content === "string" ? new Blob([content], { type }) : content);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The same rows as a typed Excel workbook, built by the API (numbers, dates and codes keep their kind). */
export function toXlsx(name: string, head: string[], rows: (string | number | null | undefined)[][]): Promise<Blob> {
  return postForFile("/v1/lists/xlsx", { name, head, rows: rows.map((row) => row.map((value) => value ?? null)) });
}
