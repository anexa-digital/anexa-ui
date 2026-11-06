import type { SortingState } from "@tanstack/react-table";

// The order of a server list as it travels in the URL and to the API: `field:desc,field2:asc`.
export function toSortParam(sorting: SortingState): string | undefined {
  return sorting.length ? sorting.map((item) => `${item.id}:${item.desc ? "desc" : "asc"}`).join(",") : undefined;
}

export function fromSortParam(value: string | undefined): SortingState {
  if (!value) return [];
  const sorting: SortingState = [];
  for (const part of value.split(",")) {
    const [id, direction] = part.split(":");
    if (!id || (direction !== "asc" && direction !== "desc")) return [];
    sorting.push({ id, desc: direction === "desc" });
  }
  return sorting;
}
